# AI Annotation Guide (Static Version)

This is a static-ready version of the AI Annotation Guide, designed to be hosted easily on services like GitHub Pages. The AI-powered text extraction has been replaced with a manual text entry field.

## Features

- **Manual Text Entry**: Paste or type any text you want to work with.
- **Rich Annotation Tools**: Use highlights (colors) and symbols to mark up your text.
- **Add Notes**: Attach detailed notes to any annotation.
- **Create Connections**: Visually link different annotations to map out relationships, causes, and descriptions.
- **Interactive Mind Graph**: Automatically generates a dynamic, explorable mind map of your annotations and their connections.
- **Session Management**: Save your entire session (text, annotations, and connections) to a JSON file and load it back in later.
- **Static & Portable**: No backend or build process required. Runs entirely in the browser.

## How to Deploy on GitHub Pages

1.  **Create a Repository**: Create a new public repository on GitHub.
2.  **Upload Files**: Upload all the files from this project (the `docs` folder, `metadata.json`, and this `README.md`) to your new repository.
3.  **Enable GitHub Pages**:
    *   In your repository, go to `Settings` > `Pages`.
    *   Under "Build and deployment", set the `Source` to **Deploy from a branch**.
    *   Set the `Branch` to `main` (or whichever branch you are using) and the folder to `/docs`.
    *   Click `Save`.
4.  **Done!**: Your site will be live at `https://<your-username>.github.io/<your-repo-name>/` in a few minutes.

## How to Use the Application

1.  **Enter Text**: Open the live URL. You will see a large text area. Paste or type the text you want to annotate and click "Start Annotating".
2.  **Annotate**:
    *   Highlight a piece of text with your mouse.
    *   A small toolbar will appear. Click on a color or symbol to create an annotation.
    *   Alternatively, use the tools in the right-hand sidebar.
3.  **Add Details**: Click on any of your annotations in the text. The sidebar will update, allowing you to add a detailed note.
4.  **Connect Ideas**:
    *   Click on an existing annotation in the text.
    *   An action toolbar will appear above it. Click a connection type (e.g., "cause", "description").
    *   Your cursor will change. Click a second annotation to complete the link.
5.  **Visualize**: Click the "Mind Graph" button in the top header to see a visual representation of your notes. You can zoom, pan, and drag nodes around.
6.  **Save & Load**: Use the "Save" and "Load" buttons in the sidebar to export your work to a `.json` file or import a previous session.
