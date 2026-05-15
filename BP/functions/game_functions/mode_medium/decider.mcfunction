# = ROOMS =
scoreboard players set room1 medium 1
scoreboard players set room2 medium 1
scoreboard players set room3 medium 1
# = EXIT ROOM =

# = SCORES =
scoreboard players set loaded1 medium 0
scoreboard players set loaded2 medium 0
scoreboard players set loaded3 medium 0
scoreboard players set started4 medium 0
# = Players =
execute as @a[tag=mediumlift] at @s run tag @s add medium
execute as @a[tag=medium] at @s run tag @s remove mediumlift
execute as @a[tag=medium] at @s run tag @s remove lobby
scoreboard players operation p_game medium = p_lift medium
scoreboard players operation p_amount medium = p_lift medium
# = ROOM SPAWNER =
# // room 1
#execute if score loaded1 medium matches 0 run summon brr:flood_room 8 -59 52 0 0 * medium_room1
execute if score room1 medium matches 1 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/room1/1_stone_platforms
execute if score room1 medium matches 2 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/room1/2_plenty_of_space
execute if score room1 medium matches 3 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/room1/3_dusty_bridges
# // room 2
execute if score room2 medium matches 1 as @e[type=brr:flood_room, name=medium_room1_anchor] at @s run function game_functions/mode_medium/room2/1_confusing_lines
execute if score room2 medium matches 2 as @e[type=brr:flood_room, name=medium_room1_anchor] at @s run function game_functions/mode_medium/room2/2_advanced_tech
execute if score room2 medium matches 3 as @e[type=brr:flood_room, name=medium_room1_anchor] at @s run function game_functions/mode_medium/room2/3_mechanical_issue
# // room 3
execute if score room3 medium matches 1 as @e[type=brr:flood_room, name=medium_room2_anchor] at @s run function game_functions/mode_medium/room3/1_labyrinth
execute if score room3 medium matches 2 as @e[type=brr:flood_room, name=medium_room2_anchor] at @s run function game_functions/mode_medium/room3/2_better_chances
execute if score room3 medium matches 3 as @e[type=brr:flood_room, name=medium_room2_anchor] at @s run function game_functions/mode_medium/room3/3_electric_tower

effect @e[type=brr:flood_room] water_breathing infinite 255 true