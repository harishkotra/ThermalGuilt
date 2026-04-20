export function ghostPalette(ghostType: string) {
  switch (ghostType) {
    case "Ice Queen":
      return { ring: "ring-[#7ef6ff]", fill: "#61d3ff", glow: "shadow-ghost" };
    case "Cool Cat":
      return { ring: "ring-[#7ef6c8]", fill: "#7ef6c8", glow: "shadow-ghost" };
    case "Warm Hug":
      return { ring: "ring-[#ffb26f]", fill: "#ffb26f", glow: "shadow-[0_0_40px_rgba(255,178,111,0.25)]" };
    case "Thermal Vampire":
      return { ring: "ring-[#ff6b5f]", fill: "#ff6b5f", glow: "shadow-shame" };
    default:
      return { ring: "ring-[#f9532d]", fill: "#f9532d", glow: "shadow-shame" };
  }
}
