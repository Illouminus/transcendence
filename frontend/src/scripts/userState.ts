import { User } from "./models/user.model";
import { UserArray } from "./users";


const avatarImg = document.getElementById("user-photo") as HTMLImageElement;

export class UserState {
	private static user: User | null = null;
	private static allUsers: UserArray[] = [];
	private static sentFriendRequests: Set<number> = new Set();
	private static tempEmail: string = "";
	private static userSocket: WebSocket | null = null;
	private static gameSocket: WebSocket | null = null;

	static setUser(user: User) {
		this.user = user;
		if(this.user.friends)
		{
			user.friends.forEach(friend => {
				friend.online = false;
			});
		}
		renderAvatar(user.avatar);
	}

	static updateUser(partial: Partial<User>) {
		if (this.user) {
			this.user = { ...this.user, ...partial };
			renderAvatar(this.user.avatar);
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
		renderAvatar(null);
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

	static updateFriendStatus(friendId: number, online: boolean, email?: string) {
		if (this.user && this.user.friends) {
			const friend = this.user.friends.find(f => f.friend_id === friendId || f.friend_email === email);
			if (friend) {
				friend.online = online;
			}
		}
	}
}


function renderAvatar(avatar?: string | null) {
	const avatarImg = document.getElementById("user-photo") as HTMLImageElement;
	if (avatarImg) {
	  avatarImg.onerror = () => {
		avatarImg.onerror = null;
		avatarImg.src = "http://localhost:8080/user/images/default_avatar.png";
	  };
	  avatarImg.src = avatar ? `http://localhost:8080/user${avatar}` : "http://localhost:8080/user/images/default_avatar.png";
	}
  }