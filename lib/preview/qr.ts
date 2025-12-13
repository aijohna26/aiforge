import QRCode from "qrcode";

export async function createPreviewQr(value: string) {
    return QRCode.toDataURL(value, {
        width: 256,
        margin: 1,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });
}
