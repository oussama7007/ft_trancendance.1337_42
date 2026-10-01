import { useState } from "react";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { translations } from "../../translations";
import type { Language } from "../../types";

export interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  messages: string[];
  isOnline: boolean;
}

interface ChatProps {
  lang: Language;
}

function Chat({ lang }: ChatProps) {
  const t = translations[lang].chat;

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      name: "Nouhaila",
      lastMessage: "Are you still interested?",
      messages: [
        "Hi! Are you still interested in the apartment?",
        "Yes, I am interested.",
        "Great! I have some questions for you.",
      ],
      isOnline: true,
    },
    {
      id: 2,
      name: "Monssif",
      lastMessage: "I have a question about the apartment.",
      messages: [
        "Hello, I have a question about the apartment.",
        "Sure, what would you like to know?",
      ],
      isOnline: false,
    },
    {
      id: 3,
      name: "Arwa",
      lastMessage: "Hello!",
      messages: ["Hello!", "Hi Arwa!"],
      isOnline: true,
    },
  ]);

  const [selectedConversationId, setSelectedConversationId] =
    useState<number>(1);

  const [showConversationList, setShowConversationList] = useState(true);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  function handleSendMessage(text: string) {
    const message = text.trim();

    if (!message || !selectedConversation) {
      return;
    }

    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              messages: [...conversation.messages, message],
              lastMessage: message,
            }
          : conversation,
      ),
    );
  }

  function handleSelectConversation(conversation: Conversation) {
    setSelectedConversationId(conversation.id);
    setShowConversationList(false);
  }

  if (!selectedConversation) {
    return (
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6"
      >
        <p className="text-[var(--color-muted)]">{t.noConversations}</p>
      </main>
    );
  }

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[var(--color-background)] p-3 sm:p-6"
    >
      <div className="mx-auto flex h-[calc(100dvh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sm:h-[calc(100dvh-3rem)]">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={`min-h-0 flex-col border-[var(--color-border)] md:flex md:border-e ${
              showConversationList ? "flex" : "hidden"
            }`}
          >
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              lang={lang}
            />
          </aside>

          <section
            className={`min-h-0 flex-col ${
              showConversationList ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setShowConversationList(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-accent-dark)] transition hover:bg-[var(--color-accent-soft)] md:hidden"
                aria-label="Back to conversations"
              >
                {lang === "ar" ? "رجوع" : lang === "fr" ? "Retour" : "Back"}
              </button>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent-dark)]">
                {selectedConversation.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h2 className="truncate font-semibold text-[var(--color-text)]">
                  {selectedConversation.name}
                </h2>

                <p className="text-sm text-[var(--color-muted)]">
                  {t.conversation}
                </p>
              </div>
            </div>

            <MessageList
              messages={selectedConversation.messages}
              lang={lang}
            />

            <MessageInput onSend={handleSendMessage} lang={lang} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default Chat;
