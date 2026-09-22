using System;
using System.IO;
using System.Text;
using System.Runtime.InteropServices;
using System.Windows.Forms;

internal static class FolderPicker
{
    [DllImport("kernel32.dll")]
    private static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")]
    private static extern IntPtr GetThreadDesktop(uint threadId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool GetUserObjectInformation(IntPtr handle, int index, StringBuilder value, int size, out int needed);

    [STAThread]
    private static int Main(string[] args)
    {
        var desktop = new StringBuilder(512);
        int needed;
        if (!GetUserObjectInformation(GetThreadDesktop(GetCurrentThreadId()), 2, desktop, 1024, out needed)) return 3;
        // An isolated desktop cannot display dialogs on the user's desktop.
        // Report this instead of leaving an invisible picker open for five minutes.
        if (!string.Equals(desktop.ToString(), "Default", StringComparison.OrdinalIgnoreCase)) return 3;
        if (args.Length == 1 && args[0] == "--check-desktop") return 0;
        if (args.Length < 1) return 2;
        string resultFile = args[0];
        string initialPath = args.Length > 1 ? args[1] : "";
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        using (var dialog = new FolderBrowserDialog())
        {
            dialog.Description = "选择作业保存根目录";
            dialog.ShowNewFolderButton = true;
            if (!string.IsNullOrWhiteSpace(initialPath) && Directory.Exists(initialPath))
                dialog.SelectedPath = initialPath;
            string selected = dialog.ShowDialog() == DialogResult.OK ? dialog.SelectedPath : "";
            File.WriteAllText(resultFile, selected, new UTF8Encoding(false));
        }
        return 0;
    }
}
