# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=hard_room1_anchor] at @s if score loaded2 hard matches 0 run summon brr:flood_room ^-8 ^-2 ^-3 0 0 * hard_room2
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run kill @e[type=brr:flood_room, name=hard_room1_anchor]
# // Level
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run structure load "hard/room2/2_broken_system:HardRoom2V2" ~-14 ~1 ~-7
# // Next Room Anchor
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run summon brr:flood_room ^-14 ^19 ^3 0 0 * hard_room2_anchor
# // - Scores -
# // buttons
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run scoreboard players add R2B1 hard 0
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run scoreboard players add R2B2 hard 0
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run scoreboard players add R2B3 hard 0
# // essential
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run scoreboard players add r2_end hard 0
# // = End =
execute as @e[type=brr:flood_room, name=hard_room2] at @s if score loaded2 hard matches 0 run scoreboard players set loaded2 hard 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard:HardTunnel" ~8 ~1 ~2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard/room2:HardRoom2" ~-14 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "hard/room2/2_broken_system:HardRoom2V2" ~-14 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B2 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B3 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^11 ^2 ^3.5 facing ^9 ^2 ^3.5
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1