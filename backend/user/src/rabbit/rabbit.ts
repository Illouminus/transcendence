// user/src/rabbit.ts
import amqp from "amqplib";
import { registerUserController } from "../controllers/users.controller";
import { updateUsernameService } from "../services/users.service";

let channel: amqp.Channel | null = null;


interface UserRegisteredEvent {
  userId: number;
  username: string;
  email: string;
}

interface UserUpdatedEvent {
  userId: number;
  username: string;
  email: string;
}

export async function connectRabbit(): Promise<void> {
  // Подключаемся к RabbitMQ
  const connection = await amqp.connect(
    `amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq:5672`
  );
  channel = await connection.createChannel();

  // Создаём exchange типа 'topic'
  await channel.assertExchange("transcendence_exchange", "topic", { durable: true });

  // Создаём очередь для User-сервиса
  const q = await channel.assertQueue("user_service_queue", { durable: true });

  // Привязываем очередь к exchange по нужным routing key
  await channel.bindQueue(q.queue, "transcendence_exchange", "user.created");
  await channel.bindQueue(q.queue, "transcendence_exchange", "user.updated");

  // Подписываемся на очередь и обрабатываем сообщения
  channel.consume(q.queue, (msg: any) => {
    if (!msg) return;
    const content = JSON.parse(msg.content.toString());
    const routingKey = msg.fields.routingKey;
    console.log("User service received event:", routingKey, content);

    // В зависимости от routing key вызываем нужный обработчик
    if (routingKey === "user.created") {
      handleUserRegistered(content);
    } else if (routingKey === "user.updated") {
      handleUserUpdated(content);
    }
    channel!.ack(msg);
  });
}

// Обработчик события регистрации
async function handleUserRegistered(data: UserRegisteredEvent) {
  console.log("Handling user.registered event with data:", data);

  await registerUserController(data.userId, data.username, data.email);
  // Здесь можно, например, создать профиль пользователя в User-сервисе
  // Пример:
  // createUserProfile(data.userId, data.username, data.avatarUrl);
}

// Обработчик события обновления
async function handleUserUpdated(data: any) {
  console.log("Handling user.updated event with data:", data);

  await updateUsernameService(data.userId, data.username, data.email);
  // Здесь можно обновить профиль пользователя, например, изменить username или другие поля
  // Пример:
  // updateUserProfile(data.userId, { username: data.username });
}


export const publishToQueue = async (routingKey: string, data: any) => {
  if (!channel) return;
  channel.publish('transcendence_exchange', routingKey, Buffer.from(JSON.stringify(data)));
};
