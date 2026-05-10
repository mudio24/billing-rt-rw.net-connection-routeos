# may/10/2026 17:47:50 by RouterOS 6.47.10
# software id = MQBQ-QGI9
#
# model = RB941-2nD
# serial number = D1130FC49CB5
/interface bridge
add name=BRIDGE-LAN
/interface wireless
set [ find default-name=wlan1 ] band=2ghz-b/g/n country=indonesia disabled=no \
    frequency=auto installation=indoor mode=ap-bridge ssid=DIONIT-HOTSPOT
/interface ethernet
set [ find default-name=ether2 ] name=LAN1
set [ find default-name=ether3 ] name=LAN2
set [ find default-name=ether4 ] name=LAN3
set [ find default-name=ether1 ] name=WAN
/interface wireless security-profiles
set [ find default=yes ] supplicant-identity=MikroTik
add authentication-types=wpa2-psk name=hotspot-sec supplicant-identity=\
    MikroTik wpa2-pre-shared-key=12345678
/ip hotspot profile
add dns-name=dionit.net hotspot-address=10.10.30.1 html-directory=hotspot-new \
    login-by=cookie,http-chap,http-pap name=hsprof1
/ip pool
add name=pool-admin ranges=10.10.10.2-10.10.10.50
add name=pool-pppoe ranges=10.10.20.2-10.10.20.254
add name=pool-hotspot ranges=10.10.30.2-10.10.30.254
add name=dhcp_pool3 ranges=10.10.30.2-10.10.30.254
add name=dhcp_pool4 ranges=10.10.30.2-10.10.30.254
add name=dhcp_pool5 ranges=10.10.30.2-10.10.30.254
/ip dhcp-server
add address-pool=pool-admin disabled=no interface=BRIDGE-LAN name=dhcp-admin
add address-pool=dhcp_pool5 disabled=no interface=wlan1 name=dhcp1
/ip hotspot
add address-pool=pool-hotspot disabled=no interface=wlan1 name=hotspot1 \
    profile=hsprof1
/ppp profile
add local-address=10.10.20.1 name=PAKET-3MB rate-limit=3M/3M remote-address=\
    pool-pppoe
add local-address=10.10.20.1 name=PAKET-5MB rate-limit=5M/5M remote-address=\
    pool-pppoe
add local-address=10.10.20.1 name=PAKET-7MB rate-limit=7M/7M remote-address=\
    pool-pppoe
add local-address=10.10.20.1 name=PAKET-10MB rate-limit=10M/10M \
    remote-address=pool-pppoe
/interface bridge port
add bridge=BRIDGE-LAN interface=LAN1
add bridge=BRIDGE-LAN interface=LAN2
add bridge=BRIDGE-LAN interface=LAN3
/ip neighbor discovery-settings
set discover-interface-list=!dynamic
/interface pppoe-server server
add disabled=no interface=BRIDGE-LAN service-name=pppoe-rtrw
/ip address
add address=10.10.10.1/24 comment=ADMIN interface=BRIDGE-LAN network=\
    10.10.10.0
add address=10.10.30.1/24 comment=HOTSPOT interface=wlan1 network=10.10.30.0
/ip dhcp-client
add disabled=no interface=WAN
/ip dhcp-server network
add address=10.10.10.0/24 dns-server=10.10.10.1 gateway=10.10.10.1
add address=10.10.30.0/24 dns-server=8.8.8.8 gateway=10.10.30.1
/ip dns
set allow-remote-requests=yes servers=8.8.8.8,1.1.1.1
/ip firewall filter
add action=passthrough chain=unused-hs-chain comment=\
    "place hotspot rules here" disabled=yes
add action=accept chain=input comment="Allow Admin LAN full access" \
    src-address=10.10.10.0/24
add action=accept chain=input comment="Allow API from Admin" dst-port=8728 \
    protocol=tcp src-address=10.10.10.0/24
add action=accept chain=input connection-state=established,related
add action=drop chain=input connection-state=invalid
add action=drop chain=input in-interface=WAN
add action=fasttrack-connection chain=forward connection-state=\
    established,related
add action=accept chain=forward connection-state=established,related
add action=drop chain=forward dst-address=10.10.20.0/24 src-address=\
    10.10.20.0/24
/ip firewall nat
add action=passthrough chain=unused-hs-chain comment=\
    "place hotspot rules here" disabled=yes
add action=masquerade chain=srcnat out-interface=WAN
add action=masquerade chain=srcnat out-interface=WAN
add action=masquerade chain=srcnat comment="masquerade hotspot network" \
    src-address=10.10.30.0/24
add action=masquerade chain=srcnat comment="masquerade hotspot network" \
    src-address=10.10.30.0/24
add action=masquerade chain=srcnat dst-address=10.10.10.2
/ip hotspot ip-binding
add address=10.10.10.0/24 comment="Bypass Admin Network" type=bypassed
/ip hotspot user
add name=guest1 password=123
add name=guest2 password=123
add name=admin password=123 server=hotspot1
/ip service
set www-ssl disabled=no
set api address=10.10.10.0/24
set winbox address=10.10.10.0/24
/ppp secret
add name=Rusli password=123 profile=PAKET-3MB service=pppoe
add name=Tulis password=123 profile=PAKET-5MB service=pppoe
add name=Toto password=123 profile=PAKET-7MB service=pppoe
add name=Ermuda password=123 profile=PAKET-10MB service=pppoe
add name=Bangun password=123 profile=PAKET-5MB service=pppoe
add name=jamal password=123 profile=PAKET-5MB service=pppoe
/system clock
set time-zone-name=Asia/Jakarta
/system identity
set name=DIONIT-CELL
