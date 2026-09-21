# = ROOMS =
scoreboard players random room1 easy 1 9
scoreboard players random room2 easy 1 4
scoreboard players random room3 easy 1 4
# = SCORES =
scoreboard players set loaded1 easy 0
scoreboard players set loaded2 easy 0
scoreboard players set loaded3 easy 0
scoreboard players set loaded4 easy 0
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
execute if score room1 easy matches 5 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/5_cb_box_trot
execute if score room1 easy matches 6 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/6_cb_power_failure
execute if score room1 easy matches 7 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/7_cb_side_floors
execute if score room1 easy matches 8 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/8_cb_thin_glass
execute if score room1 easy matches 9 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/9_cb_warehouse
execute if score room1 easy matches 10 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/10_cb_warehouse_2
execute if score room1 easy matches 11 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/11_cb_screen_warning
execute if score room1 easy matches 12 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/12_stacked
execute if score room1 easy matches 13 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/13_lack_of_space
execute if score room1 easy matches 14 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/14_restocked
execute if score room1 easy matches 15 as @e[type=brr:flood_room, name=easy_room1] at @s run function game_functions/mode_easy/room1/15_around_and_above
# // room 2
execute if score room2 easy matches 1 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/1_jump_up
execute if score room2 easy matches 2 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/2_limited_time
execute if score room2 easy matches 3 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/3_mazed_warehouse
execute if score room2 easy matches 4 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/4_extra_buttons
execute if score room2 easy matches 5 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/5_cb_power_required
execute if score room2 easy matches 6 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/6_cb_the_complex
execute if score room2 easy matches 7 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/7_cb_support
execute if score room2 easy matches 8 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/8_cb_plumbing
execute if score room2 easy matches 9 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/9_cb_filtering_system
execute if score room2 easy matches 10 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/10_cb_beams
execute if score room2 easy matches 11 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/11_overflow
execute if score room2 easy matches 12 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/12_convenience
execute if score room2 easy matches 13 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/13_wooden_supports
execute if score room2 easy matches 14 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/14_greenhouse
execute if score room2 easy matches 15 as @e[type=brr:flood_room, name=easy_room1_anchor] at @s run function game_functions/mode_easy/room2/15_broken_shelves
# // room 3
execute if score room3 easy matches 1 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/1_the_wall
execute if score room3 easy matches 2 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/2_absurd_pipeline
execute if score room3 easy matches 3 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/3_power_core
execute if score room3 easy matches 4 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/4_wooden_highground
execute if score room3 easy matches 5 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/5_cb_cooling_messup
execute if score room3 easy matches 6 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/6_cb_power_tower
execute if score room3 easy matches 7 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/7_cb_raising_towers
execute if score room3 easy matches 8 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/8_cb_temporary_solution
execute if score room3 easy matches 9 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/9_cb_no_access
execute if score room3 easy matches 10 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/10_overgrown
execute if score room3 easy matches 11 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/11_green_goods
execute if score room3 easy matches 12 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/12_cargo_overload
execute if score room3 easy matches 13 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/13_daily_mischief
execute if score room3 easy matches 14 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/14_acceleration
execute if score room3 easy matches 15 as @e[type=brr:flood_room, name=easy_room2_anchor] at @s run function game_functions/mode_easy/room3/15_rabbits_nest
# // exit room
execute as @e[type=brr:flood_room, name=easy_room3_anchor] at @s run function game_functions/mode_easy/room_exit/exit_room

effect @e[type=brr:flood_room] water_breathing infinite 255 true