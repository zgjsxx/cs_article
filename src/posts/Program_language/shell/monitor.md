
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