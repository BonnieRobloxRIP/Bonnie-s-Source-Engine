# = ROOMS =
scoreboard players random room1 easy 1 4
scoreboard players random room2 easy 1 4
scoreboard players random room3 easy 1 3
# = EXIT ROOM =

# = SCORES =
scoreboard players set loaded1 easy 0
scoreboard players set loaded2 easy 0
scoreboard players set loaded3 easy 0
scoreboard players set started4 easy 0
# = Players =
execute as @a[tag=easylift] at @s run tag @s add easy
execute as @a[tag=easy] at @s run tag @s remove easylift
execute as @a[tag=easy] at @s run tag @s remove lobby
scoreboard players operation p_game easy = p_lift easy
scoreboard players operation p_amount easy = p_lift easy
# = ROOM SPAWNER =
# // room 1
execute if score loaded1 easy matches 0 run summon brr:flood_room 8 -59 52 0 0 * easy_room1
execute if score room1 easy matches 1 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/1_ruined_bridge
execute if score room1 easy matches 2 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/2_strange_warehouse
execute if score room1 easy matches 3 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/3_storage_low
execute if score room1 easy matches 4 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/4_alternative_way
# // room 2
execute if score room2 easy matches 1 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/1_jump_up
execute if score room2 easy matches 2 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/2_limited_time
execute if score room2 easy matches 3 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/3_mazed_warehouse
execute if score room2 easy matches 4 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/4_extra_buttons
# // room 3
execute if score room3 easy matches 1 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/1_the_wall
execute if score room3 easy matches 2 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/2_absurd_pipeline
execute if score room3 easy matches 3 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/3_power_core
execute if score room3 easy matches 4 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/4_wooden_highground


effect @e[type=brr:flood_room] water_breathing infinite 255 true