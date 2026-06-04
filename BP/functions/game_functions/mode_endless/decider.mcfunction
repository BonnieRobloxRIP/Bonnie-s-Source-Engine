# = DECIDER =
# // difficulty. 1 = easy, 2 = medium, 3 = hard
scoreboard players random difficulty endless 1 2
# // Room
execute if score difficulty endless matches 1 run scoreboard players random room endless 1 3
execute if score difficulty endless matches 2 run scoreboard players random room endless 1 3
execute if score difficulty endless matches 3 run scoreboard players random room endless 1 3
# // Level = easy
execute if score difficulty endless matches 1 if score room endless matches 1 run scoreboard players random variant endless 1 4
execute if score difficulty endless matches 1 if score room endless matches 2 run scoreboard players random variant endless 1 4
execute if score difficulty endless matches 1 if score room endless matches 3 run scoreboard players random variant endless 1 4
# // Level = medium
execute if score difficulty endless matches 2 if score room endless matches 1 run scoreboard players random variant endless 1 3
execute if score difficulty endless matches 2 if score room endless matches 2 run scoreboard players random variant endless 1 3
execute if score difficulty endless matches 2 if score room endless matches 3 run scoreboard players random variant endless 1 3
# = SCORES =
execute if score difficulty endless matches 1 if score room endless matches 1..3 run scoreboard players set endless_timer_s endless 21
execute if score difficulty endless matches 2 if score room endless matches 1..3 run scoreboard players set endless_timer_s endless 16
execute if score difficulty endless matches 3 if score room endless matches 1..3 run scoreboard players set endless_timer_s endless 11
scoreboard players set endless_timer_ms endless 0
# = ROOM SPAWNER =
# // Easy
# // room 1
execute if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room1/1_ruined_bridge
execute if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room1/2_strange_warehouse
execute if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room1/3_storage_low
execute if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room1/4_alternative_way
# // room 2
execute if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room2/1_jump_up
execute if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room2/2_limited_time
execute if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room2/3_mazed_warehouse
execute if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room2/4_extra_buttons
# // room 3
execute if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room3/1_the_wall
execute if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room3/2_absurd_pipeline
execute if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room3/3_power_core
execute if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room3/4_wooden_highground
# // Medium
# // room 1
execute if score difficulty endless matches 2 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room1/1_stone_platforms
execute if score difficulty endless matches 2 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room1/2_plenty_of_space
execute if score difficulty endless matches 2 if score room endless matches 1 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room1/3_dusty_bridges
# // room 2
execute if score difficulty endless matches 2 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room2/1_confusing_lines
execute if score difficulty endless matches 2 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room2/2_advanced_tech
execute if score difficulty endless matches 2 if score room endless matches 2 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room2/3_mechanical_bridges
# // room 3
execute if score difficulty endless matches 2 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room3/1_labyrinth
execute if score difficulty endless matches 2 if score room endless matches 3 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room3/2_better_chances
execute if score difficulty endless matches 2 if score room endless matches 3 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_medium/room3/3_electric_tower
