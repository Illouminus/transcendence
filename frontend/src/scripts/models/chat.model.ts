export interface Chat {
    id: number;
    fromUserId: number;
    toUserId: string;
    content: string;
    sent_at: string;
}