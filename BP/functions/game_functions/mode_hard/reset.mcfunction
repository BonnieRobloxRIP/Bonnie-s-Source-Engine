# = SCORES =
scoreboard players set started hard 0
scoreboard players set started2 hard 0
scoreboard players set started3 hard 0
scoreboard players set started4 hard 0
scoreboard players set reset hard 0
# // lift
scoreboard players reset lift hard
scoreboard players set start hard 0
scoreboard players set timer_s hard 20
scoreboard players set timer_ms hard 0
scoreboard players reset alarm hard
structure load "hard:HardStateAvailable" -11 93 49
# // game
scoreboard players set r1_timer_ms hard 0
scoreboard players set r1_timer_s hard 21
scoreboard players set r2_timer_ms hard 0
scoreboard players set r2_timer_s hard 21
scoreboard players set r3_timer_ms hard 0
scoreboard players set r3_timer_s hard 21
scoreboard players set r4_timer_ms hard 0
scoreboard players set r4_timer_s hard 31
scoreboard players reset R1B1 hard
scoreboard players reset R1B2 hard
scoreboard players reset R1B3 hard
scoreboard players reset R1B4 hard
scoreboard players reset R1B5 hard
scoreboard players reset R1B6 hard
scoreboard players reset R1B7 hard
scoreboard players reset R1B8 hard
scoreboard players reset R1B9 hard
scoreboard players reset R1B10 hard
scoreboard players reset R2B1 hard
scoreboard players reset R2B2 hard
scoreboard players reset R2B3 hard
scoreboard players reset R2B4 hard
scoreboard players reset R2B5 hard
scoreboard players reset R2B6 hard
scoreboard players reset R2B7 hard
scoreboard players reset R2B8 hard
scoreboard players reset R2B9 hard
scoreboard players reset R2B10 hard
scoreboard players reset R3B1 hard
scoreboard players reset R3B2 hard
scoreboard players reset R3B3 hard
scoreboard players reset R3B4 hard
scoreboard players reset R3B5 hard
scoreboard players reset R3B6 hard
scoreboard players reset R3B7 hard
scoreboard players reset R3B8 hard
scoreboard players reset R3B9 hard
scoreboard players reset R3B10 hard
scoreboard players reset R1B1a hard
scoreboard players reset R1B2a hard
scoreboard players reset R1B3a hard
scoreboard players reset R1B4a hard
scoreboard players reset R1B5a hard
scoreboard players reset R1B6a hard
scoreboard players reset R1B7a hard
scoreboard players reset R1B8a hard
scoreboard players reset R1B9a hard
scoreboard players reset R1B10a hard
scoreboard players reset R2B1a hard
scoreboard players reset R2B2a hard
scoreboard players reset R2B3a hard
scoreboard players reset R2B4a hard
scoreboard players reset R2B5a hard
scoreboard players reset R2B6a hard
scoreboard players reset R2B7a hard
scoreboard players reset R2B8a hard
scoreboard players reset R2B9a hard
scoreboard players reset R2B10a hard
scoreboard players reset R3B1a hard
scoreboard players reset R3B2a hard
scoreboard players reset R3B3a hard
scoreboard players reset R3B4a hard
scoreboard players reset R3B5a hard
scoreboard players reset R3B6a hard
scoreboard players reset R3B7a hard
scoreboard players reset R3B8a hard
scoreboard players reset R3B9a hard
scoreboard players reset R3B10a hard
scoreboard players reset core hard
scoreboard players reset core1 hard
scoreboard players reset core_laser1 hard
scoreboard players reset core_laser2 hard
scoreboard players reset core_laser3 hard
scoreboard players reset core_laser4 hard
scoreboard players set loaded1 hard 0
scoreboard players set loaded2 hard 0
scoreboard players set loaded3 hard 0
scoreboard players set loaded4 hard 0
scoreboard players reset flood1 hard
scoreboard players reset flood2 hard
scoreboard players reset flood3 hard
scoreboard players reset room1 hard
scoreboard players reset room2 hard
scoreboard players reset room3 hard
scoreboard players reset p_game hard
scoreboard players reset p_lift hard
scoreboard players reset p_amount hard
scoreboard players reset p_won hard
scoreboard players reset r1_end hard
scoreboard players reset r2_end hard
scoreboard players reset r3_end hard
scoreboard players reset r4_end hard
scoreboard players reset p_tunnel1 hard
scoreboard players reset p_tunnel2 hard
scoreboard players reset p_tunnel3 hard
scoreboard players reset r1_transition hard
scoreboard players reset r2_transition hard
scoreboard players reset r3_transition hard
scoreboard players reset r4_transition hard
scoreboard players reset left_code1 hard
scoreboard players reset left_code2 hard
scoreboard players reset left_code3 hard
scoreboard players reset right_code1 hard
scoreboard players reset right_code2 hard
scoreboard players reset right_code3 hard
scoreboard players reset code_match hard
scoreboard players reset left_code hard
scoreboard players reset right_code hard
scoreboard players reset door hard
scoreboard players reset exit_door hard
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=hard_room1] at @s run structure load "hard/room1:hardRoom1" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=hard_room2] at @s run structure load "easy/room2:Room2Remove" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=hard_room3] at @s run structure load "easy/room3:Room3Remove" ~-16 ~1 ~-7
execute as @e[type=brr:flood_room, name=hard_exit] at @s run structure load "hard/exit_room:HardExitRoomRemove" ~-5 ~-2 ~-7
structure load "hard/room1:HardRoom1" -22 -58 45
# // kill
execute as @e[type=brr:flood_room, name=hard_room1] at @s run kill @s
execute as @e[type=brr:flood_room, name=hard_room2] at @s run kill @s
execute as @e[type=brr:flood_room, name=hard_room3] at @s run kill @s
execute as @e[type=brr:flood_room, name=hard_exit] at @s run kill @s
# = PLAYERS =
tp @a[tag=hard] 0 86 -16
tp @a[tag=hardlift2] -8 89 52
gamemode a @a[tag=hardlift2]
tag @a[tag=spectator, tag=hardlift2] remove spectator
tag @a remove hardlift2
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§4Hard Mode has been Reset!"}]}