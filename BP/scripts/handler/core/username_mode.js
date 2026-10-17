// SECTION: Username Mode Ownership
// main.js runs the username moderation modes. While hidden or randomized mode is on it owns every
// player's nametag, and chat_system.js must not write its rank nametag over it (the two loops used
// to overwrite each other, flashing real names on screen).

let modeOwnsNametags = false;

export function setUsernameModeOwnsNametags(value) {
    modeOwnsNametags = Boolean(value);
}

export function usernameModeOwnsNametags() {
    return modeOwnsNametags;
}
