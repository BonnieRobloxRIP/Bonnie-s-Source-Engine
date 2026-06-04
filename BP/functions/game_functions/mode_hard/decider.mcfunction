# = ROOMS =
scoreboard players set room1 hard 1
scoreboard players set room2 hard 1
scoreboard players set room3 hard 1
# = SCORES =
scoreboard players set loaded1 hard 0
scoreboard players set loaded2 hard 0
scoreboard players set loaded3 hard 0
scoreboard players set loaded4 hard 0
# = Players =
execute as @a[tag=hardlift] at @s run tag @s add hard
execute as @a[tag=hard] at @s run tag @s remove hardlift
execute as @a[tag=hard] at @s run tag @s remove lobby
scoreboard players operation p_game hard = p_lift hard
scoreboard players operation p_amount hard = p_lift hard
# = ROOM SPAWNER =
# // room 1
execute if score loaded1 hard matches 0 run summon brr:flood_room -8 -59 52 0 0 * hard_room1
execute if score room1 hard matches 1 as @e[type=brr:flood_room, name=hard_room1] at @s run function game_functions/mode_hard/room1/1_trapped
execute if score room1 hard matches 2 as @e[type=brr:flood_room, name=hard_room1] at @s run function game_functions/mode_hard/room1/2_interesting_paths
# // room 2
execute if score room2 hard matches 1 as @e[type=brr:flood_room, name=hard_room1_anchor] at @s run function game_functions/mode_hard/room2/1_ventilation_failure
execute if score room2 hard matches 2 as @e[type=brr:flood_room, name=hard_room1_anchor] at @s run function game_functions/mode_hard/room2/2_broken_system
# // room 3
execute if score room3 hard matches 1 as @e[type=brr:flood_room, name=hard_room2_anchor] at @s run function game_functions/mode_hard/room3/1_master_lift
execute if score room3 hard matches 2 as @e[type=brr:flood_room, name=hard_room2_anchor] at @s run function game_functions/mode_hard/room3/2_tesla_power
# // exit room
#execute as @e[type=brr:flood_room, name=hard_room3_anchor] at @s run function game_functions/mode_hard/room_exit/exit_room

effect @e[type=brr:flood_room] water_breathing infinite 255 true