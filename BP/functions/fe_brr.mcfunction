summon brr:flood_room ~ ~-2 ~ 0 0 * medium_room1
scoreboard players set room1 medium 2
scoreboard players set loaded1 medium 0
scoreboard players set loaded2 medium 0
scoreboard players set started medium 1
scoreboard players set p_game medium 1
tag @s add medium
tag @s add medium_music
tag @s remove lobby
scoreboard players reset @s music
execute if score room1 medium matches 2 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/room1/2_plenty_of_space
