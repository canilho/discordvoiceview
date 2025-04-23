# Discord Voice Channel Speaker Detection Bot

This project is a Discord bot that detects users in the same voice channel and identifies who is speaking. It provides a reactive HTML view for video streams, allowing users to see who is currently active in the voice channel.

## Features

- Detects when users join or leave voice channels.
- Identifies the currently speaking user in real-time.
- Provides a reactive HTML view to display users and highlight the speaker.

## Project Structure

```
discord-bot
├── src
│   ├── bot.ts                # Entry point of the Discord bot~
│   ├── server.ts             # Server for managing conections with bot and view
│   ├── events
│   │   ├──                   # Events should be managed from here
│   ├── utils
│   │   └──                   # Tools or necessary structs
│   └── views
│       └── reactiveView.html    # HTML structure for the reactive view
├── package.json               # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                  # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd discord-bot
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Set up your Discord bot token in an environment variable or a configuration file.

## Usage

1. Add the bot to your discord


2. Start the local server:
   ```
   npm run serve
   ```

2. Join a voice channel in your Discord server to see the bot in action.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License.