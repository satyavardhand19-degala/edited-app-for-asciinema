# 🎬 Change Asciinema Video Screen Size on Ubuntu

This repository explains how to change the **video (terminal) screen size** of an existing **asciinema recording** on **Ubuntu Linux** by editing the `.cast` file **after recording**.

---

## 📖 Overview

Asciinema videos do **not use pixels** for sizing.  
Instead, the video frame is defined by **terminal dimensions**:

- **width** → number of terminal columns  
- **height** → number of terminal rows  

These values are stored in the **first line** of the `.cast` file and can be safely edited.

This method works on:
- Ubuntu Desktop
- Ubuntu Server
- Local playback and asciinema.org uploads

---

## ✅ Requirements

- Ubuntu Linux  
- `asciinema` installed  
- An existing `.cast` recording  
- `nano` text editor (installed by default on Ubuntu)

---

## 🛠 How to Change Video Screen Size (Ubuntu)

### 1️⃣ Open the Terminal

Press:

Ctrl + Alt + T

yaml
Copy code

---

### 2️⃣ Navigate to the `.cast` file location

Examples:

```bash
cd ~
or

bash
Copy code
cd ~/Videos
3️⃣ Open the .cast file using nano
bash
Copy code
nano demo.cast
Replace demo.cast with your actual file name.

4️⃣ Locate the first line of the file
You will see something like:

json
Copy code
{"version": 2, "width": 120, "height": 30}
This line defines the video (terminal) screen size.

5️⃣ Edit the width and height
Change the values to your desired size. Example:

json
Copy code
{"version": 2, "width": 80, "height": 24}
width controls how wide the terminal appears

height controls how tall the terminal appears

6️⃣ Save and exit nano
Press Ctrl + O

Press Enter to confirm

Press Ctrl + X to exit
