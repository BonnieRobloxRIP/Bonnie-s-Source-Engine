# = LOADING =
# // Level
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run structure load mystructure:EasyRoom3V1 ~-7 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run scoreboard players add R3B1 easy 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run scoreboard players add R3B2 easy 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run scoreboard players add R3B3 easy 0
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run scoreboard players add R3B4 easy 0
# // essential
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run scoreboard players add r3_end easy 0
# // = End =
execute as @s[type=brr:flood_room, name=easy_room3] at @s if score loaded3 easy matches 0 run scoreboard players set loaded3 easy 1

# = LOADING ENDLESS =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 1 run scoreboard players set loaded endless 0
# // Level
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load mystructure:EasyTunnel ~2 ~1 ~-14
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load mystructure:EasyRoom3 ~-7 ~1 ~-7
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run structure load mystructure:EasyRoom3V1 ~-7 ~1 ~-7
# // - Scores -
# // buttons
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B1 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B2 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B3 endless 0
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add R3B4 endless 0
# // essential
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players add endless_end endless 0
# // tp player to start
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tp @a[tag=endless] ^3.5 ^2 ^-11 facing ^3.5 ^2 ^-8
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run tag @a[tag=endless] remove endlesstunnel
# // = End =
execute as @s[type=brr:flood_room, name=endless] at @s if score loaded endless matches 0 run scoreboard players set loaded endless 1
