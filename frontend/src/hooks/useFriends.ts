import { useEffect, useState } from 'react';
import * as friendService from '../services/friendService';
import type { Friend, FriendRequests, FriendshipStatus } from '../services/friendService';

type Action = (userId: number) => Promise<FriendshipStatus>;

// loads my friends and requests
export function useFriends()
{
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequests>({ incoming: [], outgoing: [] });
  const [failed, setFailed] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() =>
{
    let ignore = false;

    Promise.all([friendService.getFriends(), friendService.getRequests()])
      .then(([friendList, requestList]) => {
        if (!ignore)
		{
          setFriends(friendList);
          setRequests(requestList);
        }
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });

    return () => {
      ignore = true;
    };
  }, [refresh]);

  // runs an action then reloads the lists
  async function run(action: Action, userId: number)
  {
    setFailed(false);
    try
	{
      return await action(userId);
    }
	catch
	{
      setFailed(true);
      return null;
    }
	finally
	{
      setRefresh((count) => count + 1);
    }
  }

  return {
    friends,
    requests,
    failed,
    sendRequest: (userId: number) => run(friendService.sendRequest, userId),
    acceptRequest: (userId: number) => run(friendService.acceptRequest, userId),
    rejectRequest: (userId: number) => run(friendService.rejectRequest, userId),
    cancelRequest: (userId: number) => run(friendService.cancelRequest, userId),
    removeFriend: (userId: number) => run(friendService.removeFriend, userId),
  };
}
