import amqp from 'amqplib';
import { updateUserId } from '../models/user.model';

let channel: amqp.Channel | null = null;

export const connectRabbit = async () => {
  const connection = await amqp.connect(
    `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq:5672`
  );
  channel = await connection.createChannel();

  // Создаём exchange, если его ещё нет
  await channel.assertExchange('transcendence_exchange', 'topic', { durable: true });

  // Создаём очередь для auth-сервиса
  const q = await channel.assertQueue('auth_service_queue', { durable: true });

  // Слушаем только события от user-сервиса
  await channel.bindQueue(q.queue, 'transcendence_exchange', 'user.registered');

  // Обработка входящих сообщений
  channel.consume(q.queue, async (msg: any) => {
    if (!msg) return;

    const content = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;

    console.log('AUTH — получено событие:', routingKey, content);

    switch (routingKey) {
      case 'user.registered':
        await handleUserRegistered(content);
        break;
    }

    channel!.ack(msg);
  });
};

// Публикация событий (например, auth отправляет user.created)
export const publishToQueue = async (routingKey: string, data: any) => {
  if (!channel) return;
  channel.publish('transcendence_exchange', routingKey, Buffer.from(JSON.stringify(data)));
};

// Обновление user_id в таблице Auth-сервиса
async function handleUserRegistered(data: { userId: number; email: string }) {
  console.log('AUTH — обновляем user_id:', data.email, '=>', data.userId);
  await updateUserId(data.email, data.userId);
}