# EconAgents UI

EconAgents UI is a web-based configuration tool designed to simplify the setup of economic experiments using the [econagents](https://github.com/IBEX-TUDelft/econagents) library. This UI allows you to define a single file that contains all the aspects of your experiments. It includes agent roles, game state, prompts, and other settings through an intuitive graphical interface.

## Features

- **Project Management**: Create and manage multiple experiment configurations.
- **Agent Configuration**: Define agent roles, specify LLM models, and assign tasks.
- **Game State Definition**: Structure the meta, public, and private information for your game.
- **Prompt Management**: Write and organize system and user prompts using Jinja templating, with support for partials.
- **Configuration Export**: Generates configuration files compatible with the `econagents` Python library.

## Getting Started

### Prerequisites

- Node.js and npm (or yarn) installed.
- An instance of the `econagents` game server (if you intend to run experiments).

### Installation and Running the UI

1.  **Clone the repository (if you haven't already):**

    ```bash
    git clone https://github.com/your-username/econagents-ui.git
    cd econagents-ui
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The UI will typically be available at `http://localhost:3000`.

## How to Use the UI

1.  **Open the UI in your browser.**
    You will be greeted with the Project Dashboard.

2.  **Create a New Project or Open an Existing One:**

    - Click on "Create New Project" to start a new experiment configuration.
    - Select an existing project from the dashboard to modify it.

3.  **Configure Your Experiment:**
    Once a project is open, you will typically navigate through different sections to configure:

    - **Agents & Roles**: Define the different agent types (e.g., "Speculator", "Developer"), assign them IDs, select LLM models, and specify which game phases they participate in.
    - **Game State**: Define the structure of your game's state, including `MetaInformation`, `PrivateInformation`, and `PublicInformation`. Specify fields and their properties.
    - **Prompts**: Create and edit system and user prompts for different agent roles and game phases. The UI supports Jinja templating, allowing you to use variables from the game state. You can also manage reusable prompt partials.
    - **Game Settings**: Configure general game parameters, server connection details (though these are primarily used by the `econagents` library itself), and other experiment-specific settings.

4.  **Save Your Configuration:**
    The UI will save your configurations. These are typically stored in a way that the `econagents` library can understand (e.g., JSON files or a structured format that can be easily converted).

## Running Experiments with `econagents`

The EconAgents UI is primarily a **configuration tool**. Once you have configured your experiment, you will use the main `econagents` Python library to actually run the game with LLM agents.

The configurations you create in this UI are designed to be used by the `econagents` library.

**For detailed instructions on how to run experiments using these configurations, please refer to the documentation of the `econagents` library:**

- **EconAgents GitHub Repository:** [https://github.com/IBEX-TUDelft/econagents](https://github.com/IBEX-TUDelft/econagents)
- **EconAgents Documentation:** [https://econagents.readthedocs.io/en/latest/](https://econagents.readthedocs.io/en/latest/)

Typically, you would:

1.  Export or locate the configuration file generated/managed by this UI.
2.  Use the `GameRunner` class and other components from the `econagents` library, providing them with the path to your configuration file (e.g., `game_config.yaml`).
3.  Start your game server and then run your Python script that uses `econagents` to connect agents to the game.

## License

This project is licensed under the MIT License.
