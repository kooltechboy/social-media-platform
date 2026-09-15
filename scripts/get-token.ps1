$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinCred {
    [DllImport("Advapi32.dll", SetLastError = true, EntryPoint = "CredReadW", CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags, Type;
        public string TargetName, Comment;
        public long LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist, AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias, UserName;
    }
    public static string GetSecret(string target) {
        IntPtr ptr;
        if (CredRead(target, 1, 0, out ptr)) {
            CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            return Encoding.UTF8.GetString(bytes);
        }
        return null;
    }
}
'@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
$token = [WinCred]::GetSecret("Supabase CLI:supabase")
if ($token) {
    Write-Output $token
} else {
    Write-Error "Token not found"
    exit 1
}
