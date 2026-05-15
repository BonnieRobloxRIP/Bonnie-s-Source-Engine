# = ELEVATOR TRIGGERS =
# // Easy
execute as @a[tag=lobby, tag=!easylift, x=6, y=89, z=50, dx=4, dy=3, dz=4] at @s unless score start easy matches 1..2 run tag @s add easylift
execute as @a[tag=lobby, tag=!easylift, x=6, y=89, z=50, dx=4, dy=3, dz=4] at @s if score start easy matches 2 run title @s actionbar §2THERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=easylift, x=5, y=-33, z=48, dx=6, dy=129, dz=0] at @s run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift, x=5, y=-33, z=48, dx=6, dy=129, dz=0] at @s run tag @s remove easylift
execute as @a[tag=easylift, x=11, y=-33, z=50, dx=1, dy=129, dz=4] at @s run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift, x=11, y=-33, z=50, dx=1, dy=129, dz=4] at @s run tag @s remove easylift
execute as @a[tag=easylift, x=4, y=-33, z=50, dx=1, dy=129, dz=4] at @s run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift, x=4, y=-33, z=50, dx=1, dy=129, dz=4] at @s run tag @s remove easylift
execute as @a[tag=easylift, x=5, y=-33, z=55, dx=6, dy=129, dz=1] at @s run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift, x=5, y=-33, z=55, dx=6, dy=129, dz=1] at @s run tag @s remove easylift
# // Medium
execute as @a[tag=lobby, tag=!mediumlift, x=-2, y=89, z=51, dx=4, dy=3, dz=4] at @s unless score start medium matches 1..2 run tag @s add mediumlift
execute as @a[tag=lobby, tag=!mediumlift, x=-2, y=89, z=51, dx=4, dy=3, dz=4] at @s if score start medium matches 2 run title @s actionbar §eTHERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=mediumlift, x=-3, y=-33, z=49, dx=6, dy=129, dz=0] at @s run titleraw @s actionbar {"rawtext":[{"text": "§eExiting Lift..."}]}
execute as @a[tag=mediumlift, x=-3, y=-33, z=49, dx=6, dy=129, dz=0] at @s run tag @s remove mediumlift
# // Hard

# // Extreme

# // Endless
execute as @a[tag=lobby, tag=!endlesslift, x=30, y=23, z=36, dx=4, dy=3, dz=4] at @s unless score start endless matches 1..2 run tag @s add endlesslift
execute as @a[tag=endlesslift, x=28, y=23, z=35, dx=0, dy=129, dz=6] at @s run titleraw @s actionbar {"rawtext":[{"text": "§9Exiting Lift..."}]}
execute as @a[tag=endlesslift, x=28, y=23, z=35, dx=0, dy=129, dz=6] at @s run tag @s remove endlesslift
# = SCORES =
# // Easy
scoreboard players set p_lift easy 0
execute as @a[tag=easylift] at @s run scoreboard players add p_lift easy 1
execute if score p_lift easy matches 1.. if score start easy matches 0 run scoreboard players add timer_ms easy 1
execute if score timer_ms easy matches 20.. if score start easy matches 0 run scoreboard players remove timer_s easy 1
execute if score timer_s easy matches 0 if score timer_ms easy matches 20.. run scoreboard players set start easy 1
execute if score timer_ms easy matches 20.. run scoreboard players set timer_ms easy 0
execute if score p_lift easy matches 0 run scoreboard players set timer_ms easy 19
execute if score p_lift easy matches 0 run scoreboard players set timer_s easy 20
# // Medium
scoreboard players set p_lift medium 0
execute as @a[tag=mediumlift] at @s run scoreboard players add p_lift medium 1
execute if score p_lift medium matches 1.. if score start medium matches 0 run scoreboard players add timer_ms medium 1
execute if score timer_ms medium matches 20.. if score start medium matches 0 run scoreboard players remove timer_s medium 1
execute if score timer_s medium matches 0 if score timer_ms medium matches 20.. run scoreboard players set start medium 1
execute if score timer_ms medium matches 20.. run scoreboard players set timer_ms medium 0
execute if score p_lift medium matches 0 run scoreboard players set timer_ms medium 19
execute if score p_lift medium matches 0 run scoreboard players set timer_s medium 20
# // Hard

# // Extreme

# // Endless
scoreboard players set p_lift endless 0
execute as @a[tag=endlesslift] at @s run scoreboard players add p_lift endless 1
execute if score p_lift endless matches 1.. if score start endless matches 0 run scoreboard players add timer_ms endless 1
execute if score timer_ms endless matches 20.. if score start endless matches 0 run scoreboard players remove timer_s endless 1
execute if score timer_s endless matches 0 if score timer_ms endless matches 20.. run scoreboard players set start endless 1
execute if score timer_ms endless matches 20.. run scoreboard players set timer_ms endless 0
execute if score p_lift endless matches 0 run scoreboard players set timer_ms endless 19
execute if score p_lift endless matches 0 run scoreboard players set timer_s endless 20
# = EXECUTORS =
# // Easy
execute if score start easy matches 1 run function game_functions/mode_easy/lowering
execute if score reset easy matches 1 run function game_functions/mode_easy/lowering
execute if score started easy matches 1 if score room1 easy matches 1 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_1_ruined_bridge
execute if score started easy matches 1 if score room1 easy matches 2 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_2_strange_warehouse
execute if score started easy matches 1 if score room1 easy matches 3 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_3_storage_low
execute if score started easy matches 1 if score room1 easy matches 4 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_4_alternative_way
execute if score started2 easy matches 1 if score room2 easy matches 1 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_1_jump_up
execute if score started2 easy matches 1 if score room2 easy matches 2 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_2_limited_time
execute if score started2 easy matches 1 if score room2 easy matches 3 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_3_mazed_warehouse
execute if score started2 easy matches 1 if score room2 easy matches 4 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_4_extra_buttons
execute if score started3 easy matches 1 if score room3 easy matches 1 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_1_the_wall
execute if score started3 easy matches 1 if score room3 easy matches 2 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_2_absurd_pipeline
execute if score started3 easy matches 1 if score room3 easy matches 3 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_3_power_core
execute if score started3 easy matches 1 if score room3 easy matches 4 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_4_wooden_highground
# // Medium
execute if score start medium matches 1 run function game_functions/mode_medium/lowering
execute if score reset medium matches 1 run function game_functions/mode_medium/lowering
# // Hard

# // Extreme

# // Endless
execute if score start endless matches 1 run function game_functions/mode_endless/lowering
execute if score reset endless matches 1 run function game_functions/mode_endless/lowering
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_1_ruined_bridge
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_2_strange_warehouse
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_3_storage_low
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_4_alternative_way
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_1_jump_up
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_2_limited_time
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_3_mazed_warehouse
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_4_extra_buttons
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_1_the_wall
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_2_absurd_pipeline
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_3_power_core
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_4_wooden_highground
# = PLAYERCOUNTS =
# // Easy
execute if score started easy matches 1 run scoreboard players set p_game easy 0
execute as @a[tag=easy] at @s if score started easy matches 1 run scoreboard players add p_game easy 1
# // Medium

# // Hard

# // Extreme

# // Endless
execute if score started endless matches 1 run scoreboard players set p_game endless 0
execute as @a[tag=endless] at @s if score started endless matches 1 run scoreboard players add p_game endless 1
# = RESET =
# // Easy
execute if score start easy matches 2 if score p_game easy matches 0 if score reset easy matches 0 run scoreboard players set lift easy 0
execute if score start easy matches 2 if score p_game easy matches 0 if score reset easy matches 0 run scoreboard players set reset easy 1
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_game easy < p_amount easy unless score p_won easy matches 1.. run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §4All Players Died!"}]}
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_win easy < p_amount easy unless score p_won easy = p_amount easy if score p_game easy matches 1.. run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §6Some Players Escaped!"}]}
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_won easy = p_amount easy run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §aAll Players Escaped!"}]}
# // Mediumw

# // Hard

# // Extreme

# // Endless
execute if score start endless matches 2 if score p_game endless matches 0 if score reset endless matches 0 run scoreboard players set lift endless 0
execute if score start endless matches 2 if score p_game endless matches 0 if score reset endless matches 0 run scoreboard players set reset endless 1
# = TEMPORARY =
execute as @a[tag=easytunnel3] at @s run scoreboard players add @s storage_easy 1
execute as @a[tag=easytunnel3] at @s run scoreboard players add p_won easy 1
execute as @a[tag=easytunnel3] at @s run tellraw @a {"rawtext":[{"text": "§2§lEasy mode:§b "}, {"selector": "@s"}, {"text": " §r§aEscaped the Facility!"}]}
execute as @a[tag=easytunnel3] at @s run tp @s 0 86 -16