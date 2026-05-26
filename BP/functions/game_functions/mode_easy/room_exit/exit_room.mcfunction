# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=easy_room3_anchor] at @s if score loaded4 easy matches 0 run summon brr:flood_room ^6 ^-14 ^ 0 0 * easy_exit
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run kill @e[type=brr:flood_room, name=easy_room3_anchor]
# // Level
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run structure load "easy/exit_room:EasyExitRoom" ~-6 ~-2 ~-7
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run structure load "easy/exit_room:EasyExitRoomFinale" ~15 ~10 ~-7
# // - Scores -
# // code
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players random left_code1 easy 0 1
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players random left_code2 easy 0 1
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players random left_code3 easy 0 1
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players random right_code1 easy 0 1
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players random right_code2 easy 0 1
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players random right_code3 easy 0 1
# // essential
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players add code_match easy 0
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players add r4_end easy 0
# // = End =
execute as @e[type=brr:flood_room, name=easy_exit] at @s if score loaded4 easy matches 0 run scoreboard players set loaded4 easy 1