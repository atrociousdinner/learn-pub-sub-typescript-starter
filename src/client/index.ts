import amqp from "amqplib";
import {
  clientWelcome,
  commandStatus,
  getInput,
  printClientHelp,
  printQuit,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, subscribeJSON } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { SimpleQueueType } from "../enums.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { handlerPause } from "./handlers.js";

async function main() {
  const connection = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(connection);

  console.log("Starting Peril client...");
  const userName = await clientWelcome();

  const [channel, queue] = await declareAndBind(
    conn,
    ExchangePerilDirect,
    `pause.${userName}`,
    PauseKey,
    SimpleQueueType.Transient
  );
  const gamestate = new GameState(userName);

  subscribeJSON(
    conn,
    ExchangePerilDirect,
    `pause.${userName}`,
    PauseKey,
    SimpleQueueType.Transient,
    handlerPause(gamestate)
  );

  let running = true;

  while (running) {
    const commands = await getInput("Enter the commands: ");

    switch (commands[0]) {
      case "spawn":
        if (gamestate.isPaused()) {
          console.log("Game is paused");
          break;
        }

        commandSpawn(gamestate, commands);
        break;

      case "move":
        if (gamestate.isPaused()) {
          console.log("Game is paused");
          break;
        }
        commandMove(gamestate, commands);
        break;

      case "status":
        commandStatus(gamestate);
        break;

      case "help":
        printClientHelp();
        break;

      case "spam":
        console.log(`Spamming not allowed yet`);
        break;

      case "quit":
        printQuit();
        running = false;
        break;

      default:
        console.log(`Try again`);
        break;
    }
  }

  process.on("SIGINT", async () => {
    console.log("Shutting down");

    await conn.close();

    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
