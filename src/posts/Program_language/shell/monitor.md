
监控某个进程的内存

```shell
function getPhyMem
{
    MEMUsage=$(ps -o rss -p $1|grep -v RSS)
    MEM=$(expr $MEMUsage + 0)
    num=1024
    local MEMUsageMB=$(awk 'BEGIN{printf "%.2f\n",'$MEM'/'$num'}')

    if (( $(echo "$MEMUsageMB > $MemPhyMem"|bc -l) ));then
        MemPhyMem=$MEMUsageMB
    fi
    echo "process $1 current phy mem is " $MEMUsageMB " MB"
}

function getVirtMem
{

    MEMUsage=$(ps -o vsz -p $1|grep -v VSZ)
    MEM=$(expr $MEMUsage + 0)
    num=1024
    local MEMUsageMB=$(awk 'BEGIN{printf "%.2f\n",'$MEM'/'$num'}')
    if (( $(echo "$MEMUsageMB > $MemVirtMem"|bc -l) ));then
        MemVirtMem=$MEMUsageMB
    fi

    echo "process $1 current virt mem is " $MEMUsageMB " MB"
}

MemPhyMem=0.0
MemVirtMem=0.0

while (true)
do
    getPhyMem $1
    getVirtMem $1
    echo "process $1 peak phy mem is " $MemPhyMem " MB"
    echo "process $1 peak virt mem is " $MemVirtMem " MB"
    sleep 1s
done

```


monitor 网速
```shell
#!/bin/bash

ethn=$1

while true
do
  RX_pre=$(cat /proc/net/dev | grep $ethn | sed 's/:/ /g' | awk '{print $2}')
  TX_pre=$(cat /proc/net/dev | grep $ethn | sed 's/:/ /g' | awk '{print $10}')
  sleep 1
  RX_next=$(cat /proc/net/dev | grep $ethn | sed 's/:/ /g' | awk '{print $2}')
  TX_next=$(cat /proc/net/dev | grep $ethn | sed 's/:/ /g' | awk '{print $10}')

  clear
  echo -e "\t RX `date +%k:%M:%S` TX"

  RX=$((${RX_next}-${RX_pre}))
  TX=$((${TX_next}-${TX_pre}))

  if [[ $RX -lt 1024 ]];then
    RX="${RX}B/s"
  elif [[ $RX -gt 1048576 ]];then
    RX=$(echo $RX | awk '{print $1/1048576 "MB/s"}')
  else
    RX=$(echo $RX | awk '{print $1/1024 "KB/s"}')
  fi

  if [[ $TX -lt 1024 ]];then
    TX="${TX}B/s"
  elif [[ $TX -gt 1048576 ]];then
    TX=$(echo $TX | awk '{print $1/1048576 "MB/s"}')
  else
    TX=$(echo $TX | awk '{print $1/1024 "KB/s"}')
  fi

  echo -e "$ethn \t $RX   $TX "

done
``````