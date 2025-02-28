import amqp from 'amqplib';

let channel: amqp.Channel | null = null;

export const connectRabbit = async () => {
  const connection = await amqp.connect(`amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq:5672`);
  channel = await connection.createChannel();
  await channel.assertExchange('transcendence_exchange', 'topic', { durable: true });
}; 

export const publishToQueue = async (routingKey: string, data: any) => {
  if (!channel) return;
  channel.publish('transcendence_exchange', routingKey, Buffer.from(JSON.stringify(data)));
};