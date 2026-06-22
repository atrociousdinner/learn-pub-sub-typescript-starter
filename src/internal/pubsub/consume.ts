import type { Channel } from "amqplib";
import amqp from "amqplib";
import { SimpleQueueType } from "../../enums.js";

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const channel = await conn.createChannel();
  const queue = await channel.assertQueue(queueName, {
    exclusive: queueType === SimpleQueueType.Transient,
    durable: queueType === SimpleQueueType.Durable,
    autoDelete: queueType === SimpleQueueType.Transient,
  });

  await channel.bindQueue(queueName, exchange, key);

  return [channel, queue];
}

export async function subscribeJSON <T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  
  const [channel, queue] = await declareAndBind(conn, exchange, queueName, key, queueType)
  await channel.consume(queue.queue, (message: amqp.ConsumeMessage | null) => {
    if (message === null) {
      return
    }

    const parsed_message = JSON.parse(message.content.toString())
    handler(parsed_message)
    channel.ack(message)
  })


}
