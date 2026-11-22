import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareOff } from "lucide-react";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import type { Language } from "../../types";
import { chatService } from "../../services/chatService";
import type { ApiMessage } from "../../services/chatService";
import { translations } from "../../translations";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { formatChatError } from "./chatErrorFormatter";

export interface ChatMessage {
	id: number;
	senderId: number;
	content: string;
	createdAt: string;
}

export interface Conversation {
	id: number;
	name: string;
	otherUserId: number;
	lastMessage: string;
	messages: ChatMessage[];
	isOnline: boolean;
}

interface ChatProps {
	lang: Language;
	currentUserId?: number;
}

function toChatMessage(message: ApiMessage): ChatMessage {
	return {
		id: Number(message.id),
		senderId: Number(message.senderId),
		content: message.content,
		createdAt: message.createdAt,
	};
}

function Chat({ lang, currentUserId }: ChatProps) {
	const t = translations[lang] ?? translations.en;

	const [rawConversations, setRawConversations] = useState<Omit<Conversation, "isOnline">[]>([]);
	const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
	const [showConversationList, setShowConversationList] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchParams] = useSearchParams();
	const requestedConversationId = Number(searchParams.get("conversationId"));
	const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

	const socketRef = useRef<Socket | null>(null);

	const onlineSet = useMemo(
		() => new Set(onlineUserIds.map((id) => Number(id))),
		[onlineUserIds],
	);

	const conversations: Conversation[] = useMemo(
		() =>
			rawConversations.map((conversation) => ({
				...conversation,
				otherUserId: Number(conversation.otherUserId),
				isOnline: onlineSet.has(Number(conversation.otherUserId)),
			})),
		[rawConversations, onlineSet],
	);

	useEffect(() => {
		if (currentUserId == null) return;

		const wsUrl = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
		const socket = io(wsUrl, {
			withCredentials: true,
		});

		socketRef.current = socket;

		const handleOnlineUsers = (userIds: number[]) => {
			setOnlineUserIds(
				Array.from(
					new Set(
						(Array.isArray(userIds) ? userIds : [])
							.map((id) => Number(id))
							.filter((id) => Number.isSafeInteger(id) && id > 0),
					),
				),
			);
		};

		const handleUserOnline = ({ userId }: { userId: number }) => {
			const normalizedId = Number(userId);
			if (!Number.isSafeInteger(normalizedId) || normalizedId <= 0) return;

			setOnlineUserIds((previous) =>
				previous.includes(normalizedId) ? previous : [...previous, normalizedId],
			);
		};

		const handleUserOffline = ({ userId }: { userId: number }) => {
			const normalizedId = Number(userId);
			setOnlineUserIds((previous) => previous.filter((id) => id !== normalizedId));
		};

		const handleNewMessage = (apiMessage: ApiMessage) => {
			const newMsg = toChatMessage(apiMessage);
			const targetConversationId = Number(apiMessage.conversationId);

			setRawConversations((previous) =>
				previous.map((conv) => {
					if (Number(conv.id) !== targetConversationId) return conv;

					if (conv.messages.some((msg) => Number(msg.id) === newMsg.id)) {
						return conv;
					}

					return {
						...conv,
						messages: [...conv.messages, newMsg],
						lastMessage: newMsg.content,
					};
				}),
			);
		};

		const handleSocketError = (payload: { message?: string } | string) => {
			setError(formatChatError(payload, lang, t.chat.sendError));
		};

		socket.on("onlineUsers", handleOnlineUsers);
		socket.on("userOnline", handleUserOnline);
		socket.on("userOffline", handleUserOffline);
		socket.on("newMessage", handleNewMessage);
		socket.on("chatError", handleSocketError);

		return () => {
			socket.off("onlineUsers", handleOnlineUsers);
			socket.off("userOnline", handleUserOnline);
			socket.off("userOffline", handleUserOffline);
			socket.off("newMessage", handleNewMessage);
			socket.off("chatError", handleSocketError);
			socket.disconnect();
			if (socketRef.current === socket) {
				socketRef.current = null;
			}
		};
	}, [currentUserId, lang, t.chat.sendError]);

	useEffect(() => {
		const socket = socketRef.current;
		if (!selectedConversationId || !socket) return;

		const joinConversation = () => {
			socket.emit("joinConversation", {
				conversationId: Number(selectedConversationId),
			});
		};

		if (socket.connected) {
			joinConversation();
		}

		socket.on("connect", joinConversation);

		return () => {
			socket.off("connect", joinConversation);
		};
	}, [selectedConversationId, currentUserId]);

	useEffect(() => {
		let cancelled = false;

		if (currentUserId == null) {
			setRawConversations([]);
			setSelectedConversationId(null);
			setError(null);
			setIsLoading(false);

			return () => {
				cancelled = true;
			};
		}

		const timer = setTimeout(async () => {
			setIsLoading(true);
			setError(null);

			try {
				const apiConversations = await chatService.getConversations(currentUserId, searchQuery);

				const loadedConversations = await Promise.all(
					apiConversations.map(async (conversation) => {
						const apiMessages = await chatService.getMessages(
							conversation.id,
							currentUserId,
						);

						const messages = apiMessages.map(toChatMessage);

						const p1Id = Number(conversation.participantOneId);
						const p2Id = Number(conversation.participantTwoId);
						const currentId = Number(currentUserId);

						const otherUserId = p1Id === currentId ? p2Id : p1Id;

						const participantName =
							p1Id === currentId
								? (conversation as any).participantTwoName ?? `User ${otherUserId}`
								: (conversation as any).participantOneName ?? `User ${otherUserId}`;

						return {
							id: Number(conversation.id),
							name: participantName,
							otherUserId,
							lastMessage: messages.at(-1)?.content ?? "",
							messages,
						};
					}),
				);

				if (cancelled) return;

				setRawConversations(loadedConversations);

				setSelectedConversationId((previousId) => {
					if (
						requestedConversationId &&
						loadedConversations.some((c) => c.id === requestedConversationId)
					) {
						return requestedConversationId;
					}

					if (
						previousId !== null &&
						loadedConversations.some(
							(conversation) => conversation.id === previousId,
						)
					) {
						return previousId;
					}

					return loadedConversations[0]?.id ?? null;
				});
			} catch (err) {
				if (!cancelled) {
					setError(formatChatError(err, lang, t.chat.loadError));
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [reloadKey, currentUserId, searchQuery, requestedConversationId, lang, t.chat.loadError]);

	const selectedConversation = conversations.find(
		(conversation) => conversation.id === selectedConversationId,
	);

	async function handleSendMessage(text: string) {
		const content = text.trim();

		if (!content || !selectedConversation || currentUserId == null) {
			return;
		}

		setError(null);

		try {
			const savedMessage = await chatService.sendMessage(
				selectedConversation.id,
				currentUserId,
				content,
			);

			const message = toChatMessage(savedMessage);

			socketRef.current?.emit("sendMessage", {
				id: Number(savedMessage.id),
				conversationId: Number(savedMessage.conversationId),
			});

			setRawConversations((previousConversations) =>
				previousConversations.map((conversation) =>
					conversation.id === selectedConversation.id
						? {
							...conversation,
							messages: [...conversation.messages, message],
							lastMessage: message.content,
						}
						: conversation,
				),
			);
		} catch (err) {
			setError(formatChatError(err, lang, t.chat.sendError));
		}
	}

	function handleSelectConversation(conversation: Conversation) {
		setSelectedConversationId(conversation.id);
		setShowConversationList(false);
	}

	if (isLoading && conversations.length === 0) {
		return (
			<div className="flex h-[calc(100dvh-5.5rem)] min-h-[420px] w-full items-center justify-center bg-[var(--color-surface)] text-[var(--color-muted)]">
				<p>{t.chat.loadingConversations}</p>
			</div>
		);
	}

	if (conversations.length === 0 && !searchQuery.trim()) {
		return (
			<div className="flex h-[calc(100dvh-5.5rem)] min-h-[420px] w-full flex-col items-center justify-center bg-[var(--color-surface)] p-8 text-center">
				<div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent-soft)] mb-6 text-[var(--color-accent)] shadow-sm">
					<MessageSquareOff className="h-12 w-12 stroke-[1.5]" />
				</div>

				<h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
					{t.chat.noConversationsTitle}
				</h2>

				<p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
					{t.chat.noConversationsDesc}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100dvh-5.5rem)] min-h-[420px] max-h-[calc(100dvh-5.5rem)] w-full bg-[var(--color-surface)] overflow-hidden">
			<div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
				{showConversationList && (
					<div className="h-full min-h-0 min-w-0 w-full sm:w-80 lg:w-96 shrink-0 flex flex-col">
						<ConversationList
							conversations={conversations}
							selectedConversation={selectedConversation ?? conversations[0]}
							onSelectConversation={handleSelectConversation}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							lang={lang}
						/>
					</div>
				)}

				<div className="flex flex-1 min-w-0 min-h-0 flex-col bg-[var(--color-background)] h-full overflow-hidden">
					{selectedConversation ? (
						<>
							<div className="shrink-0 min-w-0 flex items-center gap-4 px-6 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm">
								{!showConversationList && (
									<button
										type="button"
										onClick={() => setShowConversationList(true)}
										aria-label="Back to conversations"
										className="shrink-0 p-2 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition"
									>
										←
									</button>
								)}

								<div className="min-w-0 flex-1">
									<h2 className="truncate font-bold text-lg text-[var(--color-text)]">{selectedConversation.name}</h2>
									<p className="text-xs text-[var(--color-muted)]">
										{selectedConversation.isOnline ? t.chat.online : t.chat.offline}
									</p>
								</div>
							</div>

							{error && (
								<div
									className="shrink-0 m-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-700"
									role="alert"
								>
									<p className="min-w-0 break-words text-sm">{error}</p>
									<button
										type="button"
										onClick={() => setError(null)}
										aria-label="Dismiss error"
										className="shrink-0 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 rounded-lg transition"
									>
										✕
									</button>
								</div>
							)}

							<div className="flex-1 min-w-0 min-h-0 flex flex-col">
								<MessageList
									messages={selectedConversation.messages}
									currentUserId={currentUserId ?? -1}
									lang={lang}
									conversationId={selectedConversation.id}
								/>
							</div>

							<div className="shrink-0 min-w-0">
								<MessageInput onSend={handleSendMessage} lang={lang} />
							</div>
						</>
					) : (
						<div className="flex-1 min-w-0 flex flex-col items-center justify-center text-[var(--color-muted)] p-6">
							<p>{t.chat.selectToStart}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Chat;
