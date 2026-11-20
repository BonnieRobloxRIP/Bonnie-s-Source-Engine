# = SYSTEM RUN =
# - Level title -
execute as @a[tag=easy] at @s if score r5_timer_s easy matches 21 if score r5_timer_ms easy matches 10 if score started5 easy matches 1 run title @a[tag=easy] subtitle §2Almost there!
execute as @a[tag=easy] at @s if score r5_timer_s easy matches 21 if score r5_timer_ms easy matches 10 if score started5 easy matches 1 run title @a[tag=easy] title §aBONUS ROOM
# - Test for buttons -
# // Finale Button
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if block ^28 ^28 ^ brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R5B1a easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 1.. run playsound sfx.elevator.lift @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 1.. run structure load "easy/exit_room:ExitLift" ~21 ~18 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 20.. run structure load "easy/exit_room:ExitLift" ~21 ~19 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 30.. run structure load "easy/exit_room:ExitLift" ~21 ~20 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 40.. run structure load "easy/exit_room:ExitLift" ~21 ~21 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 50.. run structure load "easy/exit_room:ExitLift" ~21 ~22 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 60.. run structure load "easy/exit_room:ExitLift" ~21 ~23 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 70.. run structure load "easy/exit_room:ExitLift" ~21 ~24 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 70.. run playsound sfx.elevator.stop @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 0 if score R5B1a easy matches 70.. run scoreboard players set R5B1 easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 1 if score R5B1a easy matches 70.. run scoreboard players reset R5B1a easy
# // - Flooding -
execute if score started5 easy matches 1 if score p_game easy matches 1.. run scoreboard players add r5_timer_ms easy 1
execute if score r5_timer_ms easy matches 20.. run scoreboard players remove r5_timer_s easy 1
execute if score r5_timer_ms easy matches 20.. run scoreboard players set r5_timer_ms easy 0
execute if score r5_timer_s easy matches ..0 run scoreboard players add flood5 easy 1
# // flood part
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 1 if score r5_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Blast door has failed! The water is now flooding the exit room."}]}
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 1 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR4F" ~-5 ~-2 ~-6 0_degrees none block_by_block 2
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 2 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F1" ~20 ~9 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 3 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F1" ~20 ~10 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 4 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F2" ~20 ~11 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 5 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F3" ~20 ~12 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 6 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F4" ~20 ~13 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 7 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F5" ~20 ~14 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 8 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F1" ~20 ~15 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 9 if score r5_timer_s easy matches 0 run structure load "easy/exit_room:EMR5F2" ~20 ~16 ~-1 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 10 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F1" ~16 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 12 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F2" ~16 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 13 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F3" ~16 ~19 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 14 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F4" ~16 ~20 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 15 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F5" ~16 ~21 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 16 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F6" ~16 ~22 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 17 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F7" ~16 ~23 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 18 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F8" ~16 ~24 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 19 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F9" ~16 ~25 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 20 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F10" ~16 ~26 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 21 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F11" ~16 ~27 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 22 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F12" ~16 ~28 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 23 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F13" ~16 ~29 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood5 easy matches 24 if score r5_timer_s easy matches 0 run structure load "easy/exit_room/1_almost_there:EMR5V1F14" ~16 ~30 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r5_timer_s easy matches ..0 run scoreboard players set r5_timer_s easy 2
execute if score flood5 easy matches 25 if score r5_timer_ms easy matches 10 run scoreboard players set r5_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 1 positioned ~21 ~26 ~-1 as @a[tag=easy] at @s if entity @s[dx=2, dy=3, dz=2] run tag @s add easytunnel5
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score R5B1 easy matches 1 positioned ~21 ~26 ~-1 as @a[tag=easy] at @s unless entity @s[dx=2, dy=3, dz=2] unless score r5_end easy matches 1 run tag @s remove easytunnel5
# // exit player count
scoreboard players set p_tunnel5 easy 0
execute as @a[tag=easytunnel5] at @s run scoreboard players add p_tunnel5 easy 1
# // transition into room 3
execute if score p_tunnel5 easy = p_game easy if score r5_end easy matches 0 run scoreboard players set r5_end easy 1
execute if score r5_end easy matches 1 run scoreboard players add r5_transition easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 10.. run structure load "easy/exit_room:ExitBorderClosed" ~20 ~48 ~-2
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 10.. run playsound sfx.elevator.lift @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 10.. run playsound sfx.elevator.move @a[tag=easy]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 10.. run structure load "easy/exit_room:ExitLift" ~21 ~25 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 10.. positioned ~21 ~26 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 30.. run structure load "easy/exit_room:ExitLift" ~21 ~26 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 30.. positioned ~21 ~27 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 40.. run structure load "easy/exit_room:ExitLift" ~21 ~27 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 40.. positioned ~21 ~28 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 50.. run structure load "easy/exit_room:ExitLift" ~21 ~28 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 50.. positioned ~21 ~29 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 55.. run structure load "easy/exit_room:ExitLift" ~21 ~29 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 55.. positioned ~21 ~30 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 60.. run structure load "easy/exit_room:ExitLift" ~21 ~30 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 60.. positioned ~21 ~31 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 65.. run structure load "easy/exit_room:ExitLift" ~21 ~31 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 65.. positioned ~21 ~32 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 70.. run structure load "easy/exit_room:ExitLift" ~21 ~32 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 70.. positioned ~21 ~33 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 75.. run structure load "easy/exit_room:ExitLift" ~21 ~33 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 75.. positioned ~21 ~34 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 80.. run structure load "easy/exit_room:ExitLift" ~21 ~34 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 80.. positioned ~21 ~35 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 85.. run structure load "easy/exit_room:ExitLift" ~21 ~35 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 85.. positioned ~21 ~36 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 90.. run structure load "easy/exit_room:ExitLift" ~21 ~36 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 90.. positioned ~21 ~37 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 90.. run camera @a[tag=easy] fade time 1 0 1 color 255 255 255
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 95.. run structure load "easy/exit_room:ExitLift" ~21 ~37 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 95.. positioned ~21 ~38 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 100.. run structure load "easy/exit_room:ExitLift" ~21 ~38 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 100.. positioned ~21 ~39 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 105.. run structure load "easy/exit_room:ExitLift" ~21 ~39 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 105.. positioned ~21 ~40 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 110.. run structure load "easy/exit_room:ExitLift" ~21 ~40 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 110.. positioned ~21 ~41 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 115.. run structure load "easy/exit_room:ExitLift" ~21 ~41 ~-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r5_transition easy matches 115.. positioned ~21 ~42 ~-1 as @a[tag=easy, dx=2, dy=3, dz=2] at @s run function game_functions/mode_easy/extra/exit_room/player_tp
execute if score r5_transition easy matches 115.. run scoreboard players set easy_victory lobby 1
execute if score r5_transition easy matches 115.. run scoreboard players reset R5B1 easy
execute if score r5_transition easy matches 115.. run scoreboard players reset r5_timer_ms easy
execute if score r5_transition easy matches 115.. run scoreboard players reset r5_timer_s easy
execute if score r5_transition easy matches 115.. run scoreboard players reset r5_end easy
execute as @a[tag=easytunnel5] at @s if score r5_transition easy matches 115.. run scoreboard players add @s storage_easy 1
execute as @a[tag=easytunnel5] at @s if score r5_transition easy matches 115.. run scoreboard players add p_won easy 1
execute as @a[tag=easytunnel5] at @s if score r5_transition easy matches 115.. run tellraw @a {"rawtext":[{"text": "§2§lEasy mode:§b "}, {"selector": "@s"}, {"text": " §r§aEscaped the Facility!"}]}
execute as @a[tag=easytunnel5] at @s if score r5_transition easy matches 115.. run tp @s -39 58 -18
execute if score r5_transition easy matches 115.. run scoreboard players reset r5_transition easy