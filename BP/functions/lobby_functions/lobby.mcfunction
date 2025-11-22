# controller of all things in the lobby_functions folder, and has it's own misc stuff in it too.

# // game info for crystal, not related with this file //
# all original structure animations like meteor falling, ufo spawning and leaving, plates being sucked in, train moving, and so on are now entities with preset animations for specific moments
# every entity will spawn and play it's animation if the situation calls for it and the events will be fine tuned to sync with the animation like invisible collision blocks for if a player stands there
# despawn and such. original structures are erased, the entity comes in and a fake invisible platform is put inplace of the pre-existing plate that used to be, mimicing a seamless transition

# visual effects take a big jump in the update, skyrocketing the quality and performance so to speak

# precision with scripts is necessary. each thing must co-exist perfectly and work together.
# the events entirely depend on their respective counterpart, plate events depend on the plate entity and each of it's statistics, player events depend on the player, global events depend on global variables
# the data folders inside the events folder is for events that have complex functionality and need more mcfunctions to run better, especially some that run non-stop instead of once.
# the store_functions is designed with an array like idea. plate related cosmetics such as color, ornaments and extra slots interact with the game directly as far as taking part in special events and such (being animated with the ufo coming over and alike)
# the player store_functions folders are purely if not entirely script based and depend on you entirely. the plate related ones as well since the script side will handle unlocking, equipping and unequipping them. the mcfunction side handles ingame appearance.

# the events depend entirely on the gamemode, the world (see brr.mcfunction for info on what "world" is) and the host control panel.
# the host control panel is able to alter what events are enabled/disabled live. option also exists to change what events some gamemodes disable/enable.

# settings item is entirely client sided and gives/removes tags from the player based on their settings that determine stuff i can detect in mcfunctions like if they want music to play or not.
# settings also include the ability to be "afk" from the match (not get picked to play, the stop tag 2.0)

# certain events are able to alter the player's model, animations or effects.

# the lab contains functions like interactivity with custom blocks, inserting found items on the pedistals, unlocking locked rooms at certain item found count, or playing lost audio logs/reading found books
# the lab unlocks cutscenes based on how many items are found, the cutscene for all 4 items found forces the ongoing game (if any) to end, freezes all players and plays as if it's an cinematic masterpiece, the other cutscenes for 3 or less items found happen at the end of ongoing rounds or immediately if none are active
# the lab does not exist in the subspace realm lobby

# the lobby has a few interactable places like the soda machine, plushies squeaking, flower picking/watering (regrow), feeding fish in the underground pond.
# the lobby skins affect everything in the lobby and add/remove interactable things. skins affect lobby music (if any exists for them it will stop rotating default ones)
# the lobby parkour always gets more things to say each update, 10 or 20 lines extra to the roaster of thingies.

# the subspace realm has nothing in common with horrific housing after the very first gamemode
# the subspace realm gamemodes are adventure minigames with exploration, challenge and first person shooter styled storytelling and dynamic enviroments
# the lobby of the subspace is 2 thousand blocks big with the skybox (accounts all islands floating in the space around us)

# the bunnytron boss of the overworld is an prototype titan suit bonnie had scrapped for himself, rendered useless since he does not need to look bigger to be stronger lorewise.
# bunnytron is music based and at a specific part of the song where female chords appear the entire fight changes visually to be in the subspace realm, boss changes appearance to look corrupted and subspace-y. can be achieved with entity states so a new entity is not required
# bunnytron is based on the ring gamemode but more circular with the boss in the middle smashing houses.

# the subspace boss fight happens at the edge of the realm
# the death of the first boss activates the second one to lose it and fight as well
# the boss fight is music based, at specific parts of it's song different scripted things happen from the entity or world.
# the player losing results in a fake ending, the player winning results in the aftermath

# he aftermath is the subspace and overworld lobbies combining, the players being able to play both subspace and normal gamemodes in rotation during votings. unlocks new room in the lab
# two entities now roam the lobby, brr & mml. rabbits and cats ocasionally spawn per chance rarely near them (they can interact with them)
# the unlocked lab room contains lore about the day everything went wrong that got brr & mml in the subspace realm, giving closure to the game's story