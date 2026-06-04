summon brr:flood_room ~ ~-2 ~ 0 0 * medium_room3
scoreboard players set room3 medium 3
scoreboard players set loaded3 medium 0
scoreboard players set loaded4 medium 0
scoreboard players set started3 medium 1
scoreboard players set p_game medium 1
tag @s add medium
tag @s add medium_music
tag @s remove lobby
scoreboard players reset @s music
execute if score room3 medium matches 3 as @e[type=brr:flood_room, name=medium_room3] at @s run function game_functions/mode_medium/room3/3_electric_tower
