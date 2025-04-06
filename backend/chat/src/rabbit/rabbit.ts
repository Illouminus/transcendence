import amqp from "amqplib";
import { sendMessageService, getConversationsService } from "../services/chat.service";


let channel: amqp.Channel | null = null;

interface MessageSentEvent {
	conversationId: number;
	senderId: number;
	content: string;
}

interface ConversationCreatedEvent {
	user1Id: number;
	user2Id: number;
}

export async function connectRabbit(): Promise<void> {
	// Connexion à RabbitMQ
	const connection = await amqp.connect(
		`amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq:5672`
	);
	channel = await connection.createChannel();

	// Création d'un exchange "topic"
	await channel.assertExchange("transcendence_exchange", "topic", { durable: true });

	// Création de la queue pour le service de chat
	const q = await channel.assertQueue("chat_service_queue", { durable: true });

	// Liaison de la queue aux événements de chat
	await channel.bindQueue(q.queue, "transcendence_exchange", "chat.message_sent");
	await channel.bindQueue(q.queue, "transcendence_exchange", "chat.conversation_created");

	// Écoute des messages
	channel.consume(q.queue, (msg: any) => {
		if (!msg) return;
		const content = JSON.parse(msg.content.toString());
		const routingKey = msg.fields.routingKey;
		console.log("Chat service received event:", routingKey, content);

		// Traitement selon l'événement reçu
		if (routingKey === "chat.message_sent") {
			handleMessageSent(content);
		} else if (routingKey === "chat.conversation_created") {
			handleConversationCreated(content);
		}
		channel!.ack(msg);
	});
}

// Traitement d'un message envoyé
async function handleMessageSent(data: MessageSentEvent) {
	console.log("Handling chat.message_sent event:", data);
	await sendMessageService(data.senderId, data.conversationId, data.content);


}

// Traitement d'une conversation créée
async function handleConversationCreated(data: ConversationCreatedEvent) {
	console.log("Handling chat.conversation_created event:", data);
	await getConversationsService(data.user1Id); // Ou une autre logique pour créer la conversation

}
