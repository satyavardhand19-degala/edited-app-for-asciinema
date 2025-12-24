import json
import tkinter as tk
from tkinter import filedialog, messagebox

# ---------- Helpers ----------

def read_cast(path):
    with open(path, "r") as f:
        lines = f.readlines()
    header = json.loads(lines[0])
    events = [json.loads(l) for l in lines[1:]]
    return header, events


def last_ts(events):
    return events[-1][0] if events else 0


# ---------- TRIM SINGLE VIDEO ----------

def trim_cast():
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
            raise ValueError("Invalid trim values")

        header, events = read_cast(file_path)

        trimmed = []
        for t, typ, data in events:
            if start <= t <= end:
                trimmed.append([(t - start) / speed, typ, data])

        save_path = filedialog.asksaveasfilename(
            defaultextension=".cast",
            filetypes=[("Asciinema files", "*.cast")]
        )
        if not save_path:
            return

        with open(save_path, "w") as f:
            f.write(json.dumps(header) + "\n")
            for ev in trimmed:
                f.write(json.dumps(ev) + "\n")

        messagebox.showinfo("Success", "Trimmed video saved")

    except Exception as e:
        messagebox.showerror("Error", str(e))


# ---------- COMBINE MULTIPLE VIDEOS ----------

def combine_casts():
    try:
        files = filedialog.askopenfilenames(
            title="Select asciinema files (in order)",
            filetypes=[("Asciinema files", "*.cast")]
        )
        if not files:
            return

        combined_events = []
        offset = 0
        base_header = None

        for i, path in enumerate(files):
            header, events = read_cast(path)

            if i == 0:
                base_header = header
            else:
                if header["width"] != base_header["width"] or header["height"] != base_header["height"]:
                    raise ValueError("All files must have same width and height")

            for t, typ, data in events:
                combined_events.append([t + offset, typ, data])

            offset += last_ts(events)

        save_path = filedialog.asksaveasfilename(
            title="Save combined video",
            defaultextension=".cast",
            filetypes=[("Asciinema files", "*.cast")]
        )
        if not save_path:
            return

        with open(save_path, "w") as f:
            f.write(json.dumps(base_header) + "\n")
            for ev in combined_events:
                f.write(json.dumps(ev) + "\n")

        messagebox.showinfo("Success", "Videos combined successfully!")

    except Exception as e:
        messagebox.showerror("Error", str(e))


# ---------- UI ----------

root = tk.Tk()
root.title("Asciinema Editor")
root.geometry("540x420")
root.resizable(False, False)

tk.Label(root, text="Asciinema Editor",
         font=("Arial", 16, "bold")).pack(pady=10)

frame = tk.Frame(root)
frame.pack(pady=15)

tk.Label(frame, text="Start Time (sec):").grid(row=0, column=0, sticky="w")
start_entry = tk.Entry(frame, width=15)
start_entry.insert(0, "0")
start_entry.grid(row=0, column=1)

tk.Label(frame, text="End Time (sec):").grid(row=1, column=0, sticky="w")
end_entry = tk.Entry(frame, width=15)
end_entry.insert(0, "999999")
end_entry.grid(row=1, column=1)

tk.Label(frame, text="Speed:").grid(row=2, column=0, sticky="w")
speed_entry = tk.Entry(frame, width=15)
speed_entry.insert(0, "1")
speed_entry.grid(row=2, column=1)

# Buttons
tk.Button(
    root,
    text="Trim / Edit Single Video",
    command=trim_cast,
    width=35,
    height=2,
    bg="#2196F3",
    fg="white"
).pack(pady=10)

tk.Button(
    root,
    text="Combine Multiple Videos",
    command=combine_casts,
    width=35,
    height=2,
    bg="#4CAF50",
    fg="white"
).pack(pady=10)

tk.Label(
    root,
    text="Trim OR Combine asciinema recordings",
    fg="gray"
).pack(side="bottom", pady=10)

root.mainloop()
