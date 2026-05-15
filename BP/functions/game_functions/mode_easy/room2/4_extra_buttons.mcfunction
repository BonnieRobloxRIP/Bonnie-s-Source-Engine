# = LOADING =
# // Load Positioning From Anchor
execute as @s[type=brr:flood_room, name=easy_room1_anchor] at @s if score loaded2 easy matches 0 run summon brr:flood_room ^4 ^-2 ^8 0 0 * easy_room2
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run kill @e[type=brr:flood_room, name=easy_room1_anchor]
# // Level
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run structure load "easy/room2/4_extra_buttons:EasyRoom2V4" ~-7 ~1 ~-7
# // Next Room Anchor
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run summon brr:flood_room ^-4 ^19 ^14 0 0 * easy_room2_anchor
# // - Scores -
# // buttons
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B1 easy 0
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B2 easy 0
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B3 easy 0
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B4 easy 0
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B5 easy 0
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B6 easy 0
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add R2B7 easy 0
# // essential
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players add r2_end easy 0
# // = End =
execute as @e[type=brr:flood_room, name=easy_room2] at @s if score loaded2 easy matches 0 run scoreboard players set loaded2 easy 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "easy:EasyTunnel" ~-5 ~1 ~-14
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "easy/room2:EasyRoom2" ~-7 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load "easy/room2/4_extra_buttons:EasyRoom2V4" ~-7 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B2 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B3 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B4 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B5 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B6 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R2B7 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^-3.5 ^2 ^-11 facing ^-3.5 ^2 ^-8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1
