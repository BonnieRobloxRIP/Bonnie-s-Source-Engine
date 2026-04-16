# = DIFFICULTY =
scoreboard players set difficulty endless 1
# // Room
execute if score difficulty endless matches 1 run scoreboard players random room endless 1 3
# // Level
execute if score difficulty endless matches 1 if score room endless matches 1 run scoreboard players random variant endless 1 2
execute if score difficulty endless matches 1 if score room endless matches 2 run scoreboard players random variant endless 1 2
execute if score difficulty endless matches 1 if score room endless matches 3 run scoreboard players set variant endless 1
# = SCORES =
execute if score difficulty endless matches 1 if score room endless matches 1 run scoreboard players set endless_timer_s endless 20
execute if score difficulty endless matches 2 if score room endless matches 1 run scoreboard players set endless_timer_s endless 15
execute if score difficulty endless matches 3 if score room endless matches 1 run scoreboard players set endless_timer_s endless 10
execute if score difficulty endless matches 1 if score room endless matches 2..3 run scoreboard players set endless_timer_s endless 21
execute if score difficulty endless matches 2 if score room endless matches 2..3 run scoreboard players set endless_timer_s endless 16
execute if score difficulty endless matches 3 if score room endless matches 2..3 run scoreboard players set endless_timer_s endless 11
scoreboard players set endless_timer_ms endless 0
# = ROOM SPAWNER =
# // room 1
execute if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room1/1_ruined_bridge
execute if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room1/2_warehouse
# // room 2
execute if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room2/1_jump_up
execute if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room2/2_limited_time
# // room 3
execute if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_easy/room3/1_the_wall