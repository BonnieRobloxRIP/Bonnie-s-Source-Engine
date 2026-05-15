# = SCORES =
scoreboard players set started easy 0
scoreboard players set started2 easy 0
scoreboard players set started3 easy 0
scoreboard players set started4 easy 0
scoreboard players set reset easy 0
# // lift
scoreboard players reset lift easy
scoreboard players set start easy 0
scoreboard players set timer_s easy 20
scoreboard players set timer_ms easy 0
scoreboard players reset alarm easy
structure load "easy:EasyStateAvailable" 5 93 49
# // game
scoreboard players set r1_timer_ms easy 0
scoreboard players set r1_timer_s easy 20
scoreboard players set r2_timer_ms easy 0
scoreboard players set r2_timer_s easy 21
scoreboard players set r3_timer_ms easy 0
scoreboard players set r3_timer_s easy 21
scoreboard players reset R1B1 easy
scoreboard players reset R1B2 easy
scoreboard players reset R1B3 easy
scoreboard players reset R1B4 easy
scoreboard players reset R1B5 easy
scoreboard players reset R1B6 easy
scoreboard players reset R1B7 easy
scoreboard players reset R1B8 easy
scoreboard players reset R1B9 easy
scoreboard players reset R1B10 easy
scoreboard players reset R2B1 easy
scoreboard players reset R2B2 easy
scoreboard players reset R2B3 easy
scoreboard players reset R2B4 easy
scoreboard players reset R2B5 easy
scoreboard players reset R2B6 easy
scoreboard players reset R2B7 easy
scoreboard players reset R2B8 easy
scoreboard players reset R2B9 easy
scoreboard players reset R2B10 easy
scoreboard players reset R3B1 easy
scoreboard players reset R3B2 easy
scoreboard players reset R3B3 easy
scoreboard players reset R3B4 easy
scoreboard players reset R3B5 easy
scoreboard players reset R3B6 easy
scoreboard players reset R3B7 easy
scoreboard players reset R3B8 easy
scoreboard players reset R3B9 easy
scoreboard players reset R3B10 easy
scoreboard players reset R1B1a easy
scoreboard players reset R1B2a easy
scoreboard players reset R1B3a easy
scoreboard players reset R1B4a easy
scoreboard players reset R1B5a easy
scoreboard players reset R1B6a easy
scoreboard players reset R1B7a easy
scoreboard players reset R1B8a easy
scoreboard players reset R1B9a easy
scoreboard players reset R1B10a easy
scoreboard players reset R2B1a easy
scoreboard players reset R2B2a easy
scoreboard players reset R2B3a easy
scoreboard players reset R2B4a easy
scoreboard players reset R2B5a easy
scoreboard players reset R2B6a easy
scoreboard players reset R2B7a easy
scoreboard players reset R2B8a easy
scoreboard players reset R2B9a easy
scoreboard players reset R2B10a easy
scoreboard players reset R3B1a easy
scoreboard players reset R3B2a easy
scoreboard players reset R3B3a easy
scoreboard players reset R3B4a easy
scoreboard players reset R3B5a easy
scoreboard players reset R3B6a easy
scoreboard players reset R3B7a easy
scoreboard players reset R3B8a easy
scoreboard players reset R3B9a easy
scoreboard players reset R3B10a easy
scoreboard players reset core easy
scoreboard players reset core1 easy
scoreboard players reset core_laser1 easy
scoreboard players reset core_laser2 easy
scoreboard players reset core_laser3 easy
scoreboard players reset core_laser4 easy
scoreboard players set loaded1 easy 0
scoreboard players set loaded2 easy 0
scoreboard players set loaded3 easy 0
scoreboard players reset flood1 easy
scoreboard players reset flood2 easy
scoreboard players reset flood3 easy
scoreboard players reset room1 easy
scoreboard players reset room2 easy
scoreboard players reset room3 easy
scoreboard players reset p_game easy
scoreboard players reset p_lift easy
scoreboard players reset p_amount easy
scoreboard players reset p_won easy
scoreboard players reset r1_end easy
scoreboard players reset r2_end easy
scoreboard players reset r3_end easy
scoreboard players reset p_tunnel1 easy
scoreboard players reset p_tunnel2 easy
scoreboard players reset p_tunnel3 easy
scoreboard players reset r1_transition easy
scoreboard players reset r2_transition easy
scoreboard players reset r3_transition easy
# = STRUCTURES =
# // unload
execute as @e[type=brr:flood_room, name=easy_room1] at @s run structure load "easy/room1:EasyRoom1" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=easy_room2] at @s run structure load "easy/room2:Room2Remove" ~-7 ~1 ~-7
execute as @e[type=brr:flood_room, name=easy_room3] at @s run structure load "easy/room3:Room3Remove" ~-16 ~1 ~-7
structure load "easy/room1:EasyRoom1" 1 -58 45
# // kill
execute as @e[type=brr:flood_room, name=easy_room1] at @s run kill @s
execute as @e[type=brr:flood_room, name=easy_room2] at @s run kill @s
execute as @e[type=brr:flood_room, name=easy_room3] at @s run kill @s
# = PLAYERS =
tp @a[tag=easy] 0 86 -16
# = FINISH =
tellraw @a[tag=lobby] {"rawtext":[{"text":"§aEasy Mode has been Reset!"}]}