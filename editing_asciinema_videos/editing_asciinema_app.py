import json
import tkinter as tk
from tkinter import filedialog, messagebox

# ---------- Logic ----------
def edit_cast():
    try:
        file_path = filedialog.askopenfilename(
            title="Select asciinema file",
            filetypes=[("Asciinema files", "*.cast")]
        )
        if not file_path:
            return

        start = float(start_entry.get())
        end = float(end_entry.get())
        speed = float(speed_entry.get())

        if start < 0 or end <= start or speed <= 0:
            messagebox.showerror("Error", "Invalid values")
            return

        with open(file_path, "r") as f:
            lines = f.readlines()

        header = json.loads(lines[0])
        events = [json.loads(l) for l in lines[1:]]

        new_events = []
        for t, typ, data in events:
            if start <= t <= end:
                new_events.append([
                    (t - start) / speed,
                    typ,
                    data
                ])

        save_path = filedialog.asksaveasfilename(
            title="Save edited file",
            defaultextension=".cast",
            filetypes=[("Asciinema files", "*.cast")]
        )
        if not save_path:
            return

        with open(save_path, "w") as f:
            f.write(json.dumps(header) + "\n")
            for e in new_events:
                f.write(json.dumps(e) + "\n")

        messagebox.showinfo("Success", "Edited asciinema saved!")

    except Exception as e:
        messagebox.showerror("Error", str(e))


# ---------- UI ----------
root = tk.Tk()
root.title("Asciinema Editor")

# ---- Screen Size (Centered) ----
APP_WIDTH = 450
APP_HEIGHT = 320

screen_w = root.winfo_screenwidth()
screen_h = root.winfo_screenheight()

x = (screen_w // 2) - (APP_WIDTH // 2)
y = (screen_h // 2) - (APP_HEIGHT // 2)

root.geometry(f"{APP_WIDTH}x{APP_HEIGHT}+{x}+{y}")
root.resizable(False, False)

# ---- Widgets ----
tk.Label(root, text="Asciinema Editor", font=("Arial", 16, "bold")).pack(pady=10)

frame = tk.Frame(root)
frame.pack(pady=10)

tk.Label(frame, text="Start Time (seconds):").grid(row=0, column=0, sticky="w")
start_entry = tk.Entry(frame, width=15)
start_entry.grid(row=0, column=1)

tk.Label(frame, text="End Time (seconds):").grid(row=1, column=0, sticky="w")
end_entry = tk.Entry(frame, width=15)
end_entry.grid(row=1, column=1)

tk.Label(frame, text="Speed (1 = normal):").grid(row=2, column=0, sticky="w")
speed_entry = tk.Entry(frame, width=15)
speed_entry.insert(0, "1")
speed_entry.grid(row=2, column=1)

tk.Button(
    root,
    text="Edit Asciinema File",
    command=edit_cast,
    width=25,
    bg="#4CAF50",
    fg="white"
).pack(pady=20)

tk.Label(
    root,
    text="Trim • Resize duration • Clean recordings",
    fg="gray"
).pack(side="bottom", pady=10)

root.mainloop()
