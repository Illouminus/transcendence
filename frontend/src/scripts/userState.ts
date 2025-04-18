import { GameMode, GameModeSelection } from "./gameMode";
import { User } from "./models/user.model";
import { UserArray } from "./users";

const avatarImg = document.getElementById("user-photo") as HTMLImageElement;

type ConnectionChangeCallback = () => void;
type GameEventCallback = (event: GameEvent) => void;
type FriendEventCallback = (event: FriendEvent) => void;

export type GameEvent = {
	type: 
		| 'invitation_rejected'
		| 'invitation_accepted'
		| 'game_started'
		| 'game_result'
		| 'tournament_created'
		| 'tournament_state_update'
		| 'tournament_match_start'
		| 'tournament_match_complete'
		| 'tournament_completed';
	friendId?: number;
	gameResult?: {
		winnerId: number;
		score1: number;
		score2: number;
	};
	tournamentId?: string;
	tournamentState?: {
		phase: 'waiting' | 'semifinals' | 'third_place' | 'final' | 'completed';
		players: Array<{
			id: number;
			username: string;
			ready: boolean;
		}>;
		matches?: {
			semifinals?: Array<{
				player1Id: number;
				player2Id: number;
				gameId?: string;
				winner?: number;
			}>;
			thirdPlace?: {
				player1Id: number;
				player2Id: number;
				gameId?: string;
				winner?: number;
			};
			final?: {
				player1Id: number;
				player2Id: number;
				gameId?: string;
				winner?: number;
			};
		};
	};
	tournamentMatch?: {
		opponentId: number;
		gameId: number;
		matchType: 'semifinal' | 'final' | 'third_place';
	};
	tournamentResult?: {
		place: number;
		podium: { userId: number; place: number }[];
	};
};

export type FriendEvent = {
	type: 'friend_blocked' | 'friend_unblocked' | 'friend_deleted' | 'friend_added' | 
		  'friend_request_rejected' | 'incoming_request' | 'friend_request_accepted' |
		  'friend_connected' | 'friend_disconnected' | 'friend_online' | 'user_unblocked';
	friendId: number;
	friendEmail?: string;
	isOnline?: boolean;
};

interface FriendsList {
	friend_id: number;
	friend_username: string;
	friend_avatar: string;
	friend_email: string;
	status: string;
	online?: boolean;
	previousOnlineStatus?: boolean;
}

export class UserState {
	private static user: User | null = null;
	private static allUsers: UserArray[] = [];
	private static sentFriendRequests: Set<number> = new Set();
	private static tempEmail: string = "";
	private static userSocket: WebSocket | null = null;
	private static gameSocket: WebSocket | null = null;
	private static gameMode: GameModeSelection | null = null;
	private static connectionChangeCallbacks: Set<ConnectionChangeCallback> = new Set();
	private static gameEventCallbacks: Set<GameEventCallback> = new Set();
	private static friendEventCallbacks: Set<FriendEventCallback> = new Set();

	static setUser(user: User) {
		this.user = user;
		if(this.user.friends)
		{
			user.friends.forEach(friend => {
				friend.online = false;
			});
		}
		this.renderAvatar(user.avatar);
	}

	static updateUser(partial: Partial<User>) {
		if (this.user) {
			this.user = { ...this.user, ...partial };
			this.renderAvatar(this.user.avatar);
		}
	}

	static getUser() {
		return this.user;
	}

	static isLoggedIn() {
		return this.user !== null;
	}

	static logout() {
		this.user = null;
		this.allUsers = [];
		this.sentFriendRequests.clear();
		this.renderAvatar(null);
		this.userSocket?.close();
		this.gameSocket?.close();
		this.userSocket = null;
		this.gameSocket = null;
		localStorage.removeItem("token");
	}

	static setAllUsers(users: UserArray[]) {
		this.allUsers = users;
	}

	static getAllUsers() {
		return this.allUsers;
	}

	static addSentFriendRequest(userId: number) {
		this.sentFriendRequests.add(userId);
	}

	static removeSentFriendRequest(userId: number) {
		this.sentFriendRequests.delete(userId);
	}

	static hasSentFriendRequest(userId: number): boolean {
		return this.sentFriendRequests.has(userId);
	}

	static setTempEmail(email: string) {
		this.tempEmail = email;
	}

	static getTempEmail() {
		return this.tempEmail;
	}
	
	static setGameSocket(socket: WebSocket) {
		this.gameSocket = socket;
	}

	static getGameSocket() {
		return this.gameSocket;
	}

	static setUserSocket(socket: WebSocket) {
		this.userSocket = socket;
	}

	static getUserSocket() {
		return this.userSocket;
	}

	static setGameMode(mode: GameModeSelection) {
		this.gameMode = mode;
	}

	static getGameMode() {
		return this.gameMode;
	}

	static updateFriendStatus(friendId: number, online: boolean, email?: string) {
		if (this.user && this.user.friends) {
			const friend = this.user.friends.find(f => f.friend_id === friendId || f.friend_email === email);
			if (friend) {
				// Only update online status if friend is not blocked
				if (friend.status !== 'blocked') {
					friend.online = online;
				}
				// Notify all subscribers about the connection change
				this.notifyConnectionChange();
			}
		}
	}

	// Subscribe to connection changes
	static onConnectionChange(callback: ConnectionChangeCallback) {
		this.connectionChangeCallbacks.add(callback);
	}

	// Unsubscribe from connection changes
	static offConnectionChange(callback: ConnectionChangeCallback) {
		this.connectionChangeCallbacks.delete(callback);
	}

	// Notify all subscribers about connection changes
	private static notifyConnectionChange() {
		this.connectionChangeCallbacks.forEach(callback => callback());
	}

	static onGameEvent(callback: GameEventCallback) {
		this.gameEventCallbacks.add(callback);
	}

	static offGameEvent(callback: GameEventCallback) {
		this.gameEventCallbacks.delete(callback);
	}

	static notifyGameEvent(event: GameEvent) {
		this.gameEventCallbacks.forEach(callback => callback(event));
	}

	static onFriendEvent(callback: FriendEventCallback) {
		this.friendEventCallbacks.add(callback);
	}

	static offFriendEvent(callback: FriendEventCallback) {
		this.friendEventCallbacks.delete(callback);
	}

	static notifyFriendEvent(event: FriendEvent) {
		if (this.user && this.user.friends) {
			const friend = this.user.friends.find(f => f.friend_id === event.friendId || f.friend_email === event.friendEmail);
			
			if (friend) {
				switch (event.type) {
					case 'friend_blocked':
						friend.status = 'blocked';
						friend.online = false;
						break;
					case 'friend_unblocked':
						friend.status = 'accepted';
						friend.online = event.isOnline ?? false;
						break;
					case 'user_unblocked':
						console.log("Event in unblocked case", event);
						friend.status = 'accepted';
						friend.online = event.isOnline ?? false;
						break;
					case 'friend_connected':
					case 'friend_online':
						if (friend.status !== 'blocked') {
							friend.online = true;
						}
						break;
					case 'friend_disconnected':
						if (friend.status !== 'blocked') {
							friend.online = false;
						}
						break;
				}
				this.notifyConnectionChange();
			}
		}
		
		this.friendEventCallbacks.forEach(callback => callback(event));
	}

	private static renderAvatar(avatar?: string | null) {
		const avatarImg = document.getElementById("user-photo") as HTMLImageElement;
		if (avatarImg) {
			avatarImg.onerror = () => {
				avatarImg.onerror = null;
				avatarImg.src = "http://localhost:8080/user/images/default_avatar.png";
			};
			avatarImg.src = avatar ? `http://localhost:8080/user${avatar}` : "http://localhost:8080/user/images/default_avatar.png";
		}
	}
}

export default UserState;