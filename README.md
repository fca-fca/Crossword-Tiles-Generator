Crossword Tile Generator

A simple, local desktop application to generate and print crossword/Scrabble-style tiles. Built with Electron.

⚠️ Context & Disclaimer

"I am not a programmer."

I am a Systems Administrator with decades of experience in IT operations, not a professional software engineer. I created this tool to solve a specific problem.

  AI Assistance: This code was written with the assistance of AI tools.

  Transparency: I have made this repository Open Source specifically so users can audit the code.

  Safety: You are encouraged to review main.js, logic.js and index.html to verify that this application interacts safely with your system.

Features

    Generates tile crosswords and export into a vector-ready SVG file.

    Preview the design with simulated colors and font styles.

    Generates a proof image to share.

    Runs entirely locally—no internet connection required.

How to Run This Code

If you want to run the source code directly (instead of using the .exe), you need Node.js installed.

  Clone this repository (or download the ZIP):
    
    Bash
    
    git clone https://github.com/fca-fca/Crossword-Tiles-Generator

Go into the folder:
    
    Bash

    cd [YOUR FOLDER NAME]

Install dependencies: (This reads the package.json file and installs Electron)
    
    Bash

    npm install

Run the app:
    
    Bash

    npm start

Security & Privacy

    Local Execution: This app runs locally on your machine.

    Data: No data is sent to the cloud.

    File Access: The app does not access your file system outside of its own operation requirements.

License

    This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.
