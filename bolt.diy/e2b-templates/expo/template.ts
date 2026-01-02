import { Template, waitForURL } from 'e2b';

export const template = Template()
    .fromNodeImage()
    .setWorkdir("/home/user/expo-app")
    .runCmd("npx create-expo-app@latest . --yes")
    .runCmd("mv /home/user/expo-app/* /home/user/ && rm -rf /home/user/expo-app")
    .setWorkdir("/home/user")
    .setStartCmd("npx expo start", waitForURL("http://localhost:8081"));


//     curl -X POST http://localhost:5173/api/e2b/execute \
//   -H "Content-Type: application/json" \
//   -d '{"command": "npx expo --version", "template": "0xcsz5virqvvmgjmqqam"}'