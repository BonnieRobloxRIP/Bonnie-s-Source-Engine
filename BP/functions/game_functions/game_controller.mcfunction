# = ELEVATOR TRIGGERS =
# // Easy
execute as @a[tag=lobby, tag=easylift2] at @s if score start easy matches 2 run title @s actionbar §2THERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=easylift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start easy matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=easylift, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove easylift
execute as @a[tag=easylift2, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§2Exiting Lift..."}]}
execute as @a[tag=easylift2, tag=!spectator] at @s unless entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove easylift2
execute as @a[tag=!spectator] at @s if entity @s[x=5.5, y=89, z=49.5, dx=5, dy=3, dz=5] unless score start easy matches 1..2 run tag @s add easylift
execute as @a[tag=!spectator] at @s if entity @s[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5] if score start easy matches 1 unless score room1 easy matches 1.. run tag @s add easylift
execute as @a[tag=!spectator] at @s if entity @s[x=5.5, y=89, z=49.5, dx=5, dy=3, dz=5] if score start easy matches 2 run tag @s add easylift2
# // Medium
execute as @a[tag=lobby, tag=mediumlift2] at @s if score start medium matches 2 run title @s actionbar §eTHERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=mediumlift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start medium matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=mediumlift, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§eExiting Lift..."}]}
execute as @a[tag=mediumlift, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run tag @s remove mediumlift
execute as @a[tag=mediumlift2, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§eExiting Lift..."}]}
execute as @a[tag=mediumlift2, tag=!spectator] at @s unless entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] run tag @s remove mediumlift2
execute as @a[tag=!spectator] at @s if entity @s[x=-2.5, y=89, z=50.5, dx=5, dy=3, dz=5] unless score start medium matches 1..2 run tag @s add mediumlift
execute as @a[tag=!spectator] at @s if entity @s[x=-2.5, y=23, z=50.5, dx=5, dy=68, dz=5] if score start medium matches 1 unless score room1 medium matches 1.. run tag @s add mediumlift
execute as @a[tag=!spectator] at @s if entity @s[x=-2.5, y=89, z=50.5, dx=5, dy=3, dz=5] if score start medium matches 2 run tag @s add mediumlift2
# // Hard
execute as @a[tag=lobby, tag=hardlift2] at @s if score start hard matches 2 run title @s actionbar §4THERE'S A GAME CURRENTLY IN PROGRESS!
execute as @a[tag=lobby, tag=hardlift2, hasitem={ item=brr:fe_spectate, quantity=0}] at @s if score start hard matches 2 run give @s brr:fe_spectate 1 0 {"minecraft:item_lock":{"mode": "lock_in_inventory"}}
execute as @a[tag=hardlift, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§4Exiting Lift..."}]}
execute as @a[tag=hardlift, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove hardlift
execute as @a[tag=hardlift2, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§4Exiting Lift..."}]}
execute as @a[tag=hardlift2, tag=!spectator] at @s unless entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] run tag @s remove hardlift2
execute as @a[tag=!spectator] at @s if entity @s[x=-10.5, y=89, z=49.5, dx=5, dy=3, dz=5] unless score start hard matches 1..2 run tag @s add hardlift
execute as @a[tag=!spectator] at @s if entity @s[x=-10.5, y=23, z=49.5, dx=5, dy=68, dz=5] if score start hard matches 1 unless score room1 hard matches 1.. run tag @s add hardlift
execute as @a[tag=!spectator] at @s if entity @s[x=-10.5, y=89, z=49.5, dx=5, dy=3, dz=5] if score start hard matches 2 run tag @s add hardlift2
# // Extreme

# // Endless
execute as @a[tag=endlesslift, tag=!spectator] at @s unless entity @s[x=29.5, y=23, z=35.5, dx=5, dy=5, dz=5] run titleraw @s actionbar {"rawtext":[{"text": "§9Exiting Lift..."}]}
execute as @a[tag=endlesslift, tag=!spectator] at @s unless entity @s[x=29.5, y=23, z=35.5, dx=5, dy=5, dz=5] run tag @s remove endlesslift
execute as @a[tag=!spectator] at @s if entity @s[x=29.5, y=23, z=35.5, dx=5, dy=5, dz=5] unless score start endless matches 1.. unless score started endless matches 1.. run tag @s add endlesslift
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
scoreboard players set p_lift hard 0
execute as @a[tag=hardlift] at @s run scoreboard players add p_lift hard 1
execute if score p_lift hard matches 1.. if score start hard matches 0 run scoreboard players add timer_ms hard 1
execute if score timer_ms hard matches 20.. if score start hard matches 0 run scoreboard players remove timer_s hard 1
execute if score timer_s hard matches 0 if score timer_ms hard matches 20.. run scoreboard players set start hard 1
execute if score timer_ms hard matches 20.. run scoreboard players set timer_ms hard 0
execute if score p_lift hard matches 0 run scoreboard players set timer_ms hard 19
execute if score p_lift hard matches 0 run scoreboard players set timer_s hard 20
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
execute if score started easy matches 1 if score room1 easy matches 5 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_5_cb_box_trot
execute if score started easy matches 1 if score room1 easy matches 6 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_6_cb_power_failure
execute if score started easy matches 1 if score room1 easy matches 7 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_7_cb_side_floors
execute if score started easy matches 1 if score room1 easy matches 8 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_8_cb_thin_glass
execute if score started easy matches 1 if score room1 easy matches 9 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_9_cb_warehouse
execute if score started easy matches 1 if score room1 easy matches 10 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_10_cb_warehouse_2
execute if score started easy matches 1 if score room1 easy matches 11 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_11_cb_screen_warning
execute if score started easy matches 1 if score room1 easy matches 12 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_12_stacked
execute if score started easy matches 1 if score room1 easy matches 13 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_13_lack_of_space
execute if score started easy matches 1 if score room1 easy matches 14 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_14_restocked
execute if score started easy matches 1 if score room1 easy matches 15 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/handler/r1_15_around_and_above
execute if score started2 easy matches 1 if score room2 easy matches 1 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_1_jump_up
execute if score started2 easy matches 1 if score room2 easy matches 2 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_2_limited_time
execute if score started2 easy matches 1 if score room2 easy matches 3 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_3_mazed_warehouse
execute if score started2 easy matches 1 if score room2 easy matches 4 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_4_extra_buttons
execute if score started2 easy matches 1 if score room2 easy matches 5 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_5_cb_power_required
execute if score started2 easy matches 1 if score room2 easy matches 6 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_6_cb_the_complex
execute if score started2 easy matches 1 if score room2 easy matches 7 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_7_cb_support
execute if score started2 easy matches 1 if score room2 easy matches 8 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_8_cb_plumbing
execute if score started2 easy matches 1 if score room2 easy matches 9 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_9_cb_filtering_system
execute if score started2 easy matches 1 if score room2 easy matches 10 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_10_cb_beams
execute if score started2 easy matches 1 if score room2 easy matches 11 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_11_overflow
execute if score started2 easy matches 1 if score room2 easy matches 12 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_12_convenience
execute if score started2 easy matches 1 if score room2 easy matches 13 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_13_wooden_supports
execute if score started2 easy matches 1 if score room2 easy matches 14 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_14_greenhouse
execute if score started2 easy matches 1 if score room2 easy matches 15 as @e[type=brr:flood_room, name=easy_room2] at @s run function game_functions/mode_easy/handler/r2_15_broken_shelves
execute if score started3 easy matches 1 if score room3 easy matches 1 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_1_the_wall
execute if score started3 easy matches 1 if score room3 easy matches 2 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_2_absurd_pipeline
execute if score started3 easy matches 1 if score room3 easy matches 3 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_3_power_core
execute if score started3 easy matches 1 if score room3 easy matches 4 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_4_wooden_highground
execute if score started3 easy matches 1 if score room3 easy matches 5 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_5_cb_cooling_messup
execute if score started3 easy matches 1 if score room3 easy matches 6 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_6_cb_power_tower
execute if score started3 easy matches 1 if score room3 easy matches 7 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_7_cb_raising_towers
execute if score started3 easy matches 1 if score room3 easy matches 8 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_8_cb_temporary_solution
execute if score started3 easy matches 1 if score room3 easy matches 9 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_9_cb_no_access
execute if score started3 easy matches 1 if score room3 easy matches 10 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_10_overgrown
execute if score started3 easy matches 1 if score room3 easy matches 11 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_11_green_goods
execute if score started3 easy matches 1 if score room3 easy matches 12 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_12_cargo_overload
execute if score started3 easy matches 1 if score room3 easy matches 13 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_13_daily_mischief
execute if score started3 easy matches 1 if score room3 easy matches 14 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_14_acceleration
execute if score started3 easy matches 1 if score room3 easy matches 15 as @e[type=brr:flood_room, name=easy_room3] at @s run function game_functions/mode_easy/handler/r3_15_rabbits_nest
execute if score started4 easy matches 1 as @e[type=brr:flood_room, name=easy_exit] at @s run function game_functions/mode_easy/handler/easy_exit_room
execute if score started5 easy matches 1 as @e[type=brr:flood_room, name=easy_exit] at @s run function game_functions/mode_easy/handler/easy_exit_room_finale
# // Medium
execute if score start medium matches 1 run function game_functions/mode_medium/lowering
execute if score reset medium matches 1 run function game_functions/mode_medium/lowering
execute if score started medium matches 1 if score room1 medium matches 1 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/handler/r1_1_stone_platforms
execute if score started medium matches 1 if score room1 medium matches 2 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/handler/r1_2_plenty_of_space
execute if score started medium matches 1 if score room1 medium matches 3 as @e[type=brr:flood_room, name=medium_room1] at @s run function game_functions/mode_medium/handler/r1_3_dusty_bridges
execute if score started2 medium matches 1 if score room2 medium matches 1 as @e[type=brr:flood_room, name=medium_room2] at @s run function game_functions/mode_medium/handler/r2_1_confusing_lines
execute if score started2 medium matches 1 if score room2 medium matches 2 as @e[type=brr:flood_room, name=medium_room2] at @s run function game_functions/mode_medium/handler/r2_2_advanced_tech
execute if score started2 medium matches 1 if score room2 medium matches 3 as @e[type=brr:flood_room, name=medium_room2] at @s run function game_functions/mode_medium/handler/r2_3_mechanical_bridges
execute if score started3 medium matches 1 if score room3 medium matches 1 as @e[type=brr:flood_room, name=medium_room3] at @s run function game_functions/mode_medium/handler/r3_1_labyrinth
execute if score started3 medium matches 1 if score room3 medium matches 2 as @e[type=brr:flood_room, name=medium_room3] at @s run function game_functions/mode_medium/handler/r3_2_better_chances
execute if score started3 medium matches 1 if score room3 medium matches 3 as @e[type=brr:flood_room, name=medium_room3] at @s run function game_functions/mode_medium/handler/r3_3_electric_tower
# // Hard
execute if score start hard matches 1 run function game_functions/mode_hard/lowering
execute if score reset hard matches 1 run function game_functions/mode_hard/lowering
execute if score started hard matches 1 if score room1 hard matches 1 as @e[type=brr:flood_room, name=hard_room1] at @s run function game_functions/mode_hard/handler/r1_1_trapped
execute if score started hard matches 1 if score room1 hard matches 2 as @e[type=brr:flood_room, name=hard_room1] at @s run function game_functions/mode_hard/handler/r1_2_interesting_paths
execute if score started2 hard matches 1 if score room2 hard matches 1 as @e[type=brr:flood_room, name=hard_room2] at @s run function game_functions/mode_hard/handler/r2_1_ventilation_failure
execute if score started2 hard matches 1 if score room2 hard matches 2 as @e[type=brr:flood_room, name=hard_room2] at @s run function game_functions/mode_hard/handler/r2_2_broken_system
execute if score started3 hard matches 1 if score room3 hard matches 1 as @e[type=brr:flood_room, name=hard_room3] at @s run function game_functions/mode_hard/handler/r3_1_master_lift
execute if score started3 hard matches 1 if score room3 hard matches 2 as @e[type=brr:flood_room, name=hard_room3] at @s run function game_functions/mode_hard/handler/r3_2_tesla_power
# // Extreme

# // Endless
execute if score start endless matches 1 run function game_functions/mode_endless/lowering
execute if score reset endless matches 1 run function game_functions/mode_endless/lowering
# easy
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_1_ruined_bridge
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_2_strange_warehouse
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_3_storage_low
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_4_alternative_way
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 5 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_5_cb_box_trot
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 6 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_6_cb_power_failure
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 7 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_7_cb_side_floors
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 8 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_8_cb_thin_glass
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 9 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_9_cb_warehouse
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 10 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_10_cb_warehouse_2
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 11 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_11_cb_screen_warning
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 12 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_12_stacked
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 13 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_13_lack_of_space
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 14 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_14_restocked
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 1 if score variant endless matches 15 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room1/r1_15_around_and_above
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_1_jump_up
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_2_limited_time
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_3_mazed_warehouse
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_4_extra_buttons
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 5 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_5_cb_power_required
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 6 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_6_cb_the_complex
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 7 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_7_cb_support
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 8 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_8_cb_plumbing
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 9 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_9_cb_filtering_system
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 10 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_10_cb_beams
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 11 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_11_overflow
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 12 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_12_convenience
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 13 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_13_wooden_supports
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 14 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_14_greenhouse
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 2 if score variant endless matches 15 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room2/r2_15_broken_shelves
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_1_the_wall
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_2_absurd_pipeline
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_3_power_core
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 4 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_4_wooden_highground
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 5 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_5_cb_cooling_messup
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 6 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_6_cb_power_tower
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 7 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_7_cb_raising_towers
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 8 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_8_cb_temporary_solution
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 9 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_9_cb_no_access
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 10 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_10_overgrown
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 11 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_11_green_goods
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 12 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_12_cargo_overload
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 13 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_13_daily_mischief
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 14 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_14_acceleration
execute if score loaded endless matches 1 if score difficulty endless matches 1 if score room endless matches 3 if score variant endless matches 15 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_easy/room3/r3_15_rabbits_nest
# medium
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room1/r1_1_stone_platforms
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room1/r1_2_plenty_of_space
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 1 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room1/r1_3_dusty_bridges
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room2/r2_1_confusing_lines
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room2/r2_2_advanced_tech
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 2 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room2/r2_3_mechanical_bridges
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room3/r3_1_labyrinth
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 3 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room3/r3_2_better_chances
execute if score loaded endless matches 1 if score difficulty endless matches 2 if score room endless matches 3 if score variant endless matches 3 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_medium/room3/r3_3_electric_tower
# hard
execute if score loaded endless matches 1 if score difficulty endless matches 3 if score room endless matches 1 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_hard/room1/r1_1_trapped
execute if score loaded endless matches 1 if score difficulty endless matches 3 if score room endless matches 1 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_hard/room1/r1_2_interesting_paths
execute if score loaded endless matches 1 if score difficulty endless matches 3 if score room endless matches 2 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_hard/room2/r2_1_ventilation_failure
execute if score loaded endless matches 1 if score difficulty endless matches 3 if score room endless matches 2 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_hard/room2/r2_2_broken_system
execute if score loaded endless matches 1 if score difficulty endless matches 3 if score room endless matches 3 if score variant endless matches 1 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_hard/room3/r3_1_master_lift
execute if score loaded endless matches 1 if score difficulty endless matches 3 if score room endless matches 3 if score variant endless matches 2 as @e[type=brr:flood_room, name=endless] at @s run function game_functions/mode_endless/mode_hard/room3/r3_2_tesla_power
# = PLAYERCOUNTS =
# // Easy
execute if score started easy matches 1 run scoreboard players set p_game easy 0
execute as @a[tag=easy] at @s if score started easy matches 1 run scoreboard players add p_game easy 1
# // Medium
execute if score started medium matches 1 run scoreboard players set p_game medium 0
execute as @a[tag=medium] at @s if score started medium matches 1 run scoreboard players add p_game medium 1
# // Hard
execute if score started hard matches 1 run scoreboard players set p_game hard 0
execute as @a[tag=hard] at @s if score started hard matches 1 run scoreboard players add p_game hard 1
# // Extreme

# // Endless
execute if score started endless matches 1 run scoreboard players set p_game endless 0
execute as @a[tag=endless] at @s if score started endless matches 1 run scoreboard players add p_game endless 1
# = RESET =
# // Easy
execute if score start easy matches 2 if score p_game easy matches 0 if score reset easy matches 0 run scoreboard players set lift easy 0
execute if score start easy matches 2 if score p_game easy matches 0 if score reset easy matches 0 run scoreboard players set reset easy 1
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_game easy < p_amount easy unless score p_won easy matches 1.. run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §4All Players Died!"}]}
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_won easy < p_amount easy unless score p_won easy = p_amount easy if score p_game easy matches 1.. run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §6Some Players Escaped!"}]}
execute if score reset easy matches 1 if score lift easy matches -1 if score start easy matches 2 if score p_won easy = p_amount easy run tellraw @a {"rawtext":[{"text": "§2Easy Mode: §aAll Players Escaped!"}]}
# // Medium
execute if score start medium matches 2 if score p_game medium matches 0 if score reset medium matches 0 run scoreboard players set lift medium 0
execute if score start medium matches 2 if score p_game medium matches 0 if score reset medium matches 0 run scoreboard players set reset medium 1
execute if score reset medium matches 1 if score lift medium matches -1 if score start medium matches 2 if score p_game medium < p_amount medium unless score p_won medium matches 1.. run tellraw @a {"rawtext":[{"text": "§eMedium Mode: §4All Players Died!"}]}
execute if score reset medium matches 1 if score lift medium matches -1 if score start medium matches 2 if score p_won medium < p_amount medium unless score p_won medium = p_amount medium if score p_game medium matches 1.. run tellraw @a {"rawtext":[{"text": "§eMedium Mode: §6Some Players Escaped!"}]}
execute if score reset medium matches 1 if score lift medium matches -1 if score start medium matches 2 if score p_won medium = p_amount medium run tellraw @a {"rawtext":[{"text": "§eMedium Mode: §aAll Players Escaped!"}]}
# // Hard
execute if score start hard matches 2 if score p_game hard matches 0 if score reset hard matches 0 run scoreboard players set lift hard 0
execute if score start hard matches 2 if score p_game hard matches 0 if score reset hard matches 0 run scoreboard players set reset hard 1
execute if score reset hard matches 1 if score lift hard matches -1 if score start hard matches 2 if score p_game hard < p_amount hard unless score p_won hard matches 1.. run tellraw @a {"rawtext":[{"text": "§4§lHard Mode: §r§4All Players Died!"}]}
execute if score reset hard matches 1 if score lift hard matches -1 if score start hard matches 2 if score p_won hard < p_amount hard unless score p_won hard = p_amount hard if score p_game hard matches 1.. run tellraw @a {"rawtext":[{"text": "§4§lHard Mode: §r§6Some Players Escaped!"}]}
execute if score reset hard matches 1 if score lift hard matches -1 if score start hard matches 2 if score p_won hard = p_amount hard run tellraw @a {"rawtext":[{"text": "§4§lHard Mode: §r§aAll Players Escaped!"}]}
# // Extreme

# // Endless
execute if score start endless matches 2 if score p_game endless matches 0 if score reset endless matches 0 run scoreboard players set lift endless 0
execute if score start endless matches 2 if score p_game endless matches 0 if score reset endless matches 0 run scoreboard players set reset endless 1
# = TEMPORARY =
execute as @a[tag=easytunnel4] at @s run scoreboard players add @s storage_easy 1
execute as @a[tag=easytunnel4] at @s run scoreboard players add p_won easy 1
execute as @a[tag=easytunnel4] at @s run tellraw @a {"rawtext":[{"text": "§a§lEasy mode:§b "}, {"selector": "@s"}, {"text": " §r§2Escaped the Facility!"}]}
execute as @a[tag=easytunnel4] at @s run tag @s add craftalog_badge_easy_win
execute as @a[tag=easytunnel4] at @s run tp @s 0 86 -16

execute as @a[tag=mediumtunnel3] at @s run scoreboard players add @s storage_medium 1
execute as @a[tag=mediumtunnel3] at @s run scoreboard players add p_won medium 1
execute as @a[tag=mediumtunnel3] at @s run tellraw @a {"rawtext":[{"text": "§e§lMedium mode:§b "}, {"selector": "@s"}, {"text": " §r§6Escaped the Facility!"}]}
execute as @a[tag=mediumtunnel3] at @s run tag @s add craftalog_badge_medium_win
execute as @a[tag=mediumtunnel3] at @s run tp @s 0 86 -16

execute as @a[tag=hardtunnel3] at @s run scoreboard players add @s storage_hard 1
execute as @a[tag=hardtunnel3] at @s run scoreboard players add p_won hard 1
execute as @a[tag=hardtunnel3] at @s run tellraw @a {"rawtext":[{"text": "§4§lHard mode:§b "}, {"selector": "@s"}, {"text": " §r§4Escaped the Facility!"}]}
execute as @a[tag=hardtunnel3] at @s run tag @s add craftalog_badge_hard_win
execute as @a[tag=hardtunnel3] at @s run tp @s 0 86 -16

# // craftalog
#difficulty peaceful