# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=hard_room2_anchor] at @s if score loaded3 hard matches 0 run summon brr:flood_room ^-8 ^-3 ^2 0 0 * hard_room3
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run kill @e[type=brr:flood_room, name=hard_room2_anchor]
# // Level
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run structure load "hard/room3/1_master_lift:HardRoom3V1" ~-8 ~1 ~-7
# // Exit Room Anchor
#execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run summon brr:flood_room ^9 ^19 ^-4 0 0 * hard_room3_anchor
# // - Scores -
# // buttons
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players add R3B1 hard 0
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players add R3B2 hard 0
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players add R3B3 hard 0
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players add R3B4 hard 0
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players add R3B5 hard 0
# // essential
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players add r3_end hard 0
# // = End =
execute as @e[type=brr:flood_room, name=hard_room3] at @s if score loaded3 hard matches 0 run scoreboard players set loaded3 hard 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard:HardTunnel" ~8 ~2 ~-3 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard/room3:HardRoom3" ~-8 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard/room3/1_master_lift:HardRoom3V1" ~-8 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B2 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B3 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B4 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B5 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^11 ^3 ^-1.5 facing ^9 ^3 ^-1.5
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1
