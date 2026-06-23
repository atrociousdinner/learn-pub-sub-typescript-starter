import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { type PlayingState } from "../internal/gamelogic/gamestate.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";

async function main() {
  const connection = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(connection);

  console.log("Starting Peril server...");

  //  const [channel, queue] = await declareAndBind(
  //    conn,
  //    ExchangePerilTopic,
  //    "game_logs",
  //    "game_logs.*",
  //    SimpleQueueType.Durable
  //  );

  process.on("SIGINT", async () => {
    console.log("Shutting down");

    await conn.close();

    process.exit(0);
  });

  const channel = await conn.createConfirmChannel();

  await channel.assertExchange(ExchangePerilDirect, "direct", {
    durable: true,
  });

  const state: PlayingState = {
    isPaused: true,
  };

  printServerHelp();

  let running = true;
  while (running) {
    const words = await getInput("Input words");
    const first_word = words[0];
    switch (first_word) {
      case "pause":
        console.log(`Is game paused? --> ${state.isPaused}. Beep Boop.`);
        publishJSON(channel, ExchangePerilDirect, PauseKey, state);

        break;

      case "resume":
        state.isPaused = false;
        publishJSON(channel, ExchangePerilDirect, PauseKey, state);

        console.log(
          `Is game paused? --> ${(state.isPaused = false)}. Beep Boop.`
        );

        break;

      case "quit":
        console.log("I am exiting. Beep Boop.");
        running = false;
        break;

      default:
        console.log("I do not understand. Try again. Beep boop.");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
