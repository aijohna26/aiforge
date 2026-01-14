import * as React from "react";
import { Image, SafeAreaView, Text, View } from "react-native";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#171717" }}>
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 120, height: 120, borderRadius: 28 }}
          accessibilityRole="image"
          accessibilityLabel="AppForge logo"
        />
        <Text style={{ color: "#f5f5f5", fontSize: 20, fontWeight: "600", marginTop: 16 }}>
          Welcome to AppForge
        </Text>
        <Text style={{ color: "#bdbdbd", fontSize: 14, marginTop: 8 }}>
          Project initialized. Ready to build.
        </Text>
      </View>
    </SafeAreaView>
  );
}
