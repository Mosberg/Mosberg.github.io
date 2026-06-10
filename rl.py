import os
import textwrap
import tkinter as tk
from tkinter import ttk, filedialog, messagebox


-----------------------------

Boilerplate template helpers

-----------------------------

PLUGIN_TEMPLATE = """\
package {package};

import com.google.inject.Provides;
import javax.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import net.runelite.api.Client;
import net.runelite.client.config.ConfigManager;
import net.runelite.client.plugins.Plugin;
import net.runelite.client.plugins.PluginDescriptor;
{overlay_import}

@Slf4j
@PluginDescriptor(
\tname = "{plugin_name}",
\tdescription = "{description}"{tags_line}
)
public class {class_name} extends Plugin
{{
\t@Inject
\tprivate Client client;

\t@Inject
\tprivate {config_class} config;
{overlay_field}

\t@Provides
\t{config_class} provideConfig(ConfigManager configManager)
\t{{
\t\treturn configManager.getConfig({config_class}.class);
\t}}
{overlay_startup}
\t@Override
\tprotected void startUp() throws Exception
\t{{
\t\tlog.info("{plugin_name} started!");
\t}}
{overlay_shutdown}
\t@Override
\tprotected void shutDown() throws Exception
\t{{
\t\tlog.info("{plugin_name} stopped!");
\t}}
{gametick_sub}
{chatmsg_sub}
}}
"""

CONFIG_TEMPLATE = """\
package {package};

import net.runelite.client.config.Config;
import net.runelite.client.config.ConfigGroup;
import net.runelite.client.config.ConfigItem;

@ConfigGroup("{config_group}")
public interface {config_class} extends Config
{{
\t@ConfigItem(
\t\tkeyName = "exampleToggle",
\t\tname = "Example toggle",
\t\tdescription = "An example config toggle"
\t)
\tdefault boolean exampleToggle()
\t{{
\t\treturn true;
\t}}
}}
"""

OVERLAY_TEMPLATE = """\
package {package};

import javax.inject.Inject;
import java.awt.Dimension;
import java.awt.Graphics2D;
import net.runelite.client.ui.overlay.Overlay;
import net.runelite.client.ui.overlay.OverlayLayer;
import net.runelite.client.ui.overlay.OverlayPosition;
import net.runelite.client.ui.overlay.OverlayPriority;

public class {overlay_class} extends Overlay
{{
\tprivate final {plugin_class} plugin;

\t@Inject
\tpublic {overlayclass}({pluginclass} plugin)
\t{{
\t\tthis.plugin = plugin;
\t\tsetPosition(OverlayPosition.DYNAMIC);
\t\tsetPriority(OverlayPriority.MED);
\t\tsetLayer(OverlayLayer.ABOVE_SCENE);
\t}}

\t@Override
\tpublic Dimension render(Graphics2D graphics)
\t{{
\t\t// Draw overlay here
\t\treturn null;
\t}}
}}
"""

GAMETICK_TEMPLATE = """\
\t@net.runelite.client.eventbus.Subscribe
\tpublic void onGameTick(net.runelite.api.events.GameTick tick)
\t{{
\t\t// Game tick logic here
\t}}
"""

CHATMSG_TEMPLATE = """\
\t@net.runelite.client.eventbus.Subscribe
\tpublic void onChatMessage(net.runelite.api.events.ChatMessage chatMessage)
\t{{
\t\t// Chat message logic here
\t}}
"""

OVERLAY_IMPORT = "import net.runelite.client.ui.overlay.OverlayManager;\n"
OVERLAYFIELD = "\t@Inject\n\tprivate OverlayManager overlayManager;\n\n\t@Inject\n\tprivate {overlayclass} overlay;\n"
OVERLAY_STARTUP = """\
\t@Override
\tprotected void startUp() throws Exception
\t{{
\t\tlog.info("{plugin_name} started!");
\t\toverlayManager.add(overlay);
\t}}
"""
OVERLAY_SHUTDOWN = """\
\t@Override
\tprotected void shutDown() throws Exception
\t{{
\t\tlog.info("{plugin_name} stopped!");
\t\toverlayManager.remove(overlay);
\t}}
"""


-----------------------------

Tkinter GUI

-----------------------------

class RuneLitePluginGenerator(tk.Tk):
    def init(self):
        super().init()
        self.title("RuneLite Plugin Generator")
        self.geometry("520x420")
        self.resizable(False, False)

        self.buildui()

    def buildui(self):
        pad = 6

        main = ttk.Frame(self, padding=10)
        main.pack(fill="both", expand=True)

        # Basic info
        lblframebasic = ttk.LabelFrame(main, text="Plugin info", padding=10)
        lblframebasic.pack(fill="x", pady=(0, 10))

        self.varpluginname = tk.StringVar()
        self.var_package = tk.StringVar(value="com.example.runelite")
        self.var_author = tk.StringVar()
        self.var_description = tk.StringVar(value="My awesome RuneLite plugin")
        self.var_tags = tk.StringVar(value="example,plugin")

        self.addlabeledentry(lblframebasic, "Plugin name (class):", self.varplugin_name, 0)
        self.addlabeledentry(lblframebasic, "Package:", self.varpackage, 1)
        self.addlabeledentry(lblframebasic, "Author (optional):", self.varauthor, 2)
        self.addlabeledentry(lblframebasic, "Description:", self.vardescription, 3)
        self.addlabeledentry(lblframebasic, "Tags (comma-separated):", self.vartags, 4)

        # Options
        lblframeopts = ttk.LabelFrame(main, text="Components", padding=10)
        lblframeopts.pack(fill="x", pady=(0, 10))

        self.varmakeconfig = tk.BooleanVar(value=True)
        self.varmakeoverlay = tk.BooleanVar(value=False)
        self.varsubgametick = tk.BooleanVar(value=True)
        self.varsubchatmsg = tk.BooleanVar(value=False)

        ttk.Checkbutton(lblframeopts, text="Generate Config interface", variable=self.varmakeconfig).grid(
            row=0, column=0, sticky="w", pady=pad
        )
        ttk.Checkbutton(lblframeopts, text="Generate Overlay class", variable=self.varmakeoverlay).grid(
            row=1, column=0, sticky="w", pady=pad
        )
        ttk.Checkbutton(lblframeopts, text="Add GameTick subscription", variable=self.varsubgametick).grid(
            row=2, column=0, sticky="w", pady=pad
        )
        ttk.Checkbutton(lblframeopts, text="Add ChatMessage subscription", variable=self.varsubchatmsg).grid(
            row=3, column=0, sticky="w", pady=pad
        )

        # Output
        lblframeout = ttk.LabelFrame(main, text="Output", padding=10)
        lblframeout.pack(fill="x", pady=(0, 10))

        self.varrootdir = tk.StringVar()
        self.addlabeledentry(lblframeout, "Project root (src/main/java/...):", self.varroot_dir, 0, width=40)

        ttk.Button(lblframeout, text="Browse…", command=self.browse_dir).grid(
            row=0, column=2, padx=(5, 0)
        )

        # Generate button
        btn_frame = ttk.Frame(main)
        btn_frame.pack(fill="x", pady=(10, 0))

        ttk.Button(btn_frame, text="Generate plugin files", command=self.generate).pack(side="right")

        # Status
        self.status_var = tk.StringVar(value="Ready.")
        ttk.Label(main, textvariable=self.status_var, foreground="#555").pack(anchor="w", pady=(8, 0))

    def addlabeled_entry(self, parent, label, var, row, width=30):
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=3)
        entry = ttk.Entry(parent, textvariable=var, width=width)
        entry.grid(row=row, column=1, sticky="w", pady=3, padx=(5, 0))
        return entry

    def browse_dir(self):
        directory = filedialog.askdirectory(title="Select project root (where src/ lives)")
        if directory:
            self.varrootdir.set(directory)

    def generate(self):
        pluginname = self.varplugin_name.get().strip()
        package = self.var_package.get().strip()
        description = self.var_description.get().strip()
        tags = [t.strip() for t in self.var_tags.get().split(",") if t.strip()]
        rootdir = self.varroot_dir.get().strip()

        if not plugin_name:
            messagebox.showerror("Error", "Plugin name is required.")
            return
        if not package:
            messagebox.showerror("Error", "Package is required.")
            return
        if not root_dir:
            messagebox.showerror("Error", "Project root directory is required.")
            return

        classname = self.sanitizeclassname(plugin_name)
        configclass = f"{classname}Config"
        overlayclass = f"{classname}Overlay"
        configgroup = classname.lower()

        # Build tags line
        tags_line = ""
        if tags:
            tags_str = ", ".join(f"\"{t}\"" for t in tags)
            tagsline = f",\n\ttags = {{{tagsstr}}}"

        # Overlay-related pieces
        overlayimport = OVERLAYIMPORT if self.varmakeoverlay.get() else ""
        overlayfield = OVERLAYFIELD.format(overlayclass=overlayclass) if self.varmakeoverlay.get() else ""
        overlaystartup = OVERLAYSTARTUP.format(pluginname=pluginname) if self.varmakeoverlay.get() else ""
        overlayshutdown = OVERLAYSHUTDOWN if self.varmakeoverlay.get() else ""

        # If overlay is enabled, we override startup/shutdown with overlay versions
        if not self.varmakeoverlay.get():
            overlay_startup = ""
            overlay_shutdown = ""

        gameticksub = GAMETICKTEMPLATE if self.varsubgametick.get() else ""
        chatmsgsub = CHATMSGTEMPLATE if self.varsubchatmsg.get() else ""

        pluginjava = PLUGINTEMPLATE.format(
            package=package,
            pluginname=pluginname,
            description=description,
            classname=classname,
            configclass=configclass if self.varmakeconfig.get() else "net.runelite.client.config.Config",
            tagsline=tagsline,
            overlayimport=overlayimport,
            overlayfield=overlayfield,
            overlaystartup=overlaystartup,
            overlayshutdown=overlayshutdown,
            gameticksub=gameticksub,
            chatmsgsub=chatmsgsub,
        )

        if not self.varmakeoverlay.get():
            # If we didn't generate overlay, we still need a basic startup/shutdown
            if "protected void startUp()" not in plugin_java:
                pluginjava = pluginjava.replace(
                    "\t@Inject\n\tprivate Client client;\n",
                    "\t@Inject\n\tprivate Client client;\n\n"
                    f"\t@Override\n\tprotected void startUp() throws Exception\n\t{{\n"
                    f'\t\tlog.info("{plugin_name} started!");\n\t}}\n\n'
                    f"\t@Override\n\tprotected void shutDown() throws Exception\n\t{{\n"
                    f'\t\tlog.info("{plugin_name} stopped!");\n\t}}\n'
                )

        config_java = ""
        if self.varmakeconfig.get():
            configjava = CONFIGTEMPLATE.format(
                package=package,
                configgroup=configgroup,
                configclass=configclass,
            )

        overlay_java = ""
        if self.varmakeoverlay.get():
            overlayjava = OVERLAYTEMPLATE.format(
                package=package,
                overlayclass=overlayclass,
                pluginclass=classname,
            )

        try:
            self.writefiles(
                rootdir=rootdir,
                package=package,
                classname=classname,
                pluginjava=pluginjava,
                configclass=configclass,
                configjava=configjava,
                overlayclass=overlayclass,
                overlayjava=overlayjava,
            )
        except Exception as e:
            messagebox.showerror("Error", f"Failed to write files:\n{e}")
            self.status_var.set("Failed.")
            return

        messagebox.showinfo("Success", "Plugin files generated successfully.")
        self.status_var.set("Generated plugin boilerplate.")

    def writefiles(
        self,
        root_dir,
        package,
        class_name,
        plugin_java,
        config_class,
        config_java,
        overlay_class,
        overlay_java,
    ):
        # Expect root_dir to contain src/main/java
        srcroot = os.path.join(rootdir, "src", "main", "java")
        packagepath = os.path.join(srcroot, *package.split("."))

        os.makedirs(packagepath, existok=True)

        pluginpath = os.path.join(packagepath, f"{class_name}.java")
        with open(plugin_path, "w", encoding="utf-8") as f:
            f.write(self.formatjava(plugin_java))

        if config_java:
            configpath = os.path.join(packagepath, f"{config_class}.java")
            with open(config_path, "w", encoding="utf-8") as f:
                f.write(self.formatjava(config_java))

        if overlay_java:
            overlaypath = os.path.join(packagepath, f"{overlay_class}.java")
            with open(overlay_path, "w", encoding="utf-8") as f:
                f.write(self.formatjava(overlay_java))

    @staticmethod
    def sanitizeclass_name(name: str) -> str:
        # Very simple: remove spaces and non-alphanumerics, capitalize words
        parts = "".join(ch if ch.isalnum() else " " for ch in name).split()
        if not parts:
            return "MyPlugin"
        return "".join(p[0].upper() + p[1:] for p in parts)

    @staticmethod
    def formatjava(code: str) -> str:
        # Strip leading spaces from template indentation
        return textwrap.dedent(code).strip() + "\n"


if name == "main":
    app = RuneLitePluginGenerator()
    app.mainloop()
