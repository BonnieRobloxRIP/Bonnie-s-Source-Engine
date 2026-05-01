# = ANIMATIONS =
# // Main Lobby Left
execute if score LobbyDoorLeft lobby matches 1 run scoreboard players add doorleft lobby 1
execute if score LobbyDoorLeft lobby matches 3 run scoreboard players add doorleft2 lobby 1
execute if score doorleft lobby matches 1 run structure load mystructure:LobbyDoor2 5 89 31
execute positioned 8 89 31 as @a[tag=lobby, r=15] at @s if score doorleft lobby matches 1 run playsound sfx.doors.opening @s
execute positioned 8 89 31 as @a[tag=lobby, r=15] at @s if score doorleft lobby matches 5 run playsound sfx.doors.opened @s
execute if score doorleft lobby matches 5 run structure load mystructure:LobbyDoor3 5 89 31
execute if score doorleft lobby matches 5 run scoreboard players set LobbyDoorLeft lobby 2
execute if score doorleft2 lobby matches 1 run structure load mystructure:LobbyDoor2 5 89 31
execute positioned 8 89 31 as @a[tag=lobby, r=15] at @s if score doorleft2 lobby matches 1 run playsound sfx.doors.opening @s
execute positioned 8 89 31 as @a[tag=lobby, r=15] at @s if score doorleft2 lobby matches 5 run playsound sfx.doors.closed @s
execute if score doorleft2 lobby matches 5 run structure load mystructure:LobbyDoor1 5 89 31
execute if score doorleft2 lobby matches 5 run scoreboard players set LobbyDoorLeft lobby 0
execute if score doorleft lobby matches 5.. run scoreboard players reset doorleft lobby
execute if score doorleft2 lobby matches 5.. run scoreboard players reset doorleft2 lobby
# // Main Lobby Right
execute if score LobbyDoorRight lobby matches 1 run scoreboard players add doorright lobby 1
execute if score LobbyDoorRight lobby matches 3 run scoreboard players add doorright2 lobby 1
execute if score doorright lobby matches 1 run structure load mystructure:LobbyDoor2 -11 89 31
execute positioned -8 89 31 as @a[tag=lobby, r=15] at @s if score doorright lobby matches 1 run playsound sfx.doors.opening @s
execute positioned -8 89 31 as @a[tag=lobby, r=15] at @s if score doorright lobby matches 5 run playsound sfx.doors.opened @s
execute if score doorright lobby matches 5 run structure load mystructure:LobbyDoor3 -11 89 31
execute if score doorright lobby matches 5 run scoreboard players set LobbyDoorRight lobby 2
execute if score doorright2 lobby matches 1 run structure load mystructure:LobbyDoor2 -11 89 31
execute positioned -8 89 31 as @a[tag=lobby, r=15] at @s if score doorright2 lobby matches 1 run playsound sfx.doors.opening @s
execute positioned -8 89 31 as @a[tag=lobby, r=15] at @s if score doorright2 lobby matches 5 run playsound sfx.doors.closed @s
execute if score doorright2 lobby matches 5 run structure load mystructure:LobbyDoor1 -11 89 31
execute if score doorright2 lobby matches 5 run scoreboard players set LobbyDoorRight lobby 0
execute if score doorright lobby matches 5.. run scoreboard players reset doorright lobby
execute if score doorright2 lobby matches 5.. run scoreboard players reset doorright2 lobby
# // Extreme Center Surface Door
execute if score ExtremeCenterDoor lobby matches 1 run scoreboard players add ecdoor lobby 1
execute if score ExtremeCenterDoor lobby matches 3 run scoreboard players add ecdoor1 lobby 1
execute if score ecdoor lobby matches 1 run structure load mystructure:ExtremeCenterDoor1 -22 92 -19
execute if score ecdoor lobby matches 3 run structure load mystructure:ExtremeCenterDoor1 -22 93 -19
execute if score ecdoor lobby matches 5 run structure load mystructure:ExtremeCenterDoor1 -22 94 -19
execute if score ecdoor lobby matches 7 run structure load mystructure:ExtremeCenterDoor1 -22 95 -19
execute if score ecdoor lobby matches 7 run scoreboard players set ExtremeCenterDoor lobby 2
execute if score ecdoor1 lobby matches 1 run structure load mystructure:ExtremeCenterDoor1a -22 95 -19
execute if score ecdoor1 lobby matches 3 run structure load mystructure:ExtremeCenterDoor1a -22 94 -19
execute if score ecdoor1 lobby matches 5 run structure load mystructure:ExtremeCenterDoor1a -22 93 -19
execute if score ecdoor1 lobby matches 7 run structure load mystructure:ExtremeCenterDoor1a -22 92 -19
execute if score ecdoor1 lobby matches 7 run scoreboard players set ExtremeCenterDoor lobby 0
execute if score ecdoor lobby matches 7.. run scoreboard players reset ecdoor lobby
execute if score ecdoor1 lobby matches 7.. run scoreboard players reset ecdoor1 lobby