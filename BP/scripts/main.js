import { world, system } from '@minecraft/server';
import { ranksScript } from './Scripts/ranksScript.js';
ranksScript["Code"].execute();
import { itemsUseScript } from './Scripts/itemsUseScript.js';
itemsUseScript["Code"].execute();
import { subspaceTripmineScript } from './Scripts/subspaceTripmineScript.js';
subspaceTripmineScript["Code"].execute();
import { blockUseScript } from './Scripts/blockUseScript.js';
blockUseScript["Code"].execute();
import { welcomeBookScript } from './Scripts/UI/welcomeBookScript.js';
welcomeBookScript["Code"].execute();
import { lifeLink } from './Events/lifeLink.js';
lifeLink["Code"].execute();
import { lifeLinkExtras } from './Events/lifeLinkExtras.js';
lifeLinkExtras["Code"].execute();

// Handles landmines
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        try {
            // Get the block the player is standing on
            const blockLocation = { x: player.location.x, y: player.location.y - 1, z: player.location.z };
            const block = player.dimension.getBlock(blockLocation);

            if (block && block.typeId === "brr:landmine") {
                player.dimension.createExplosion(block.location, 10, { allowUnderwater: true, breaksBlocks: false });
                player.dimension.playSound("block.landmine", block.location);
                player.dimension.setBlockType(block.location, "minecraft:air");
            }
        } catch (error) {
            // Player might be in an unloaded chunk, ignore the error
        }
    }
}, 2);