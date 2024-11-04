---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [MapReduce：大型集群上的简化数据处理](#mapreduce大型集群上的简化数据处理)
  - [](#)
  - [2.编程模型](#2编程模型)
    - [2.1 例子](#21-例子)
  - [附录A](#附录a)


# MapReduce：大型集群上的简化数据处理

## 

## 2.编程模型

该计算接收一组输入键值对，并生成一组输出键值对。MapReduce 库的用户将计算表示为两个函数：Map（映射）和 Reduce（归约）。

Map（映射）函数由用户编写，接收一个输入键值对并生成一组中间键值对。MapReduce 库将所有与同一中间键 I 相关联的中间值组合在一起，并将它们传递给 Reduce（归约）函数。

Reduce（归约）函数，同样由用户编写，接收一个中间键 I 和该键的一组值。它将这些值合并在一起以形成一个可能更小的值集合。通常每次调用 Reduce 函数只会产生零个或一个输出值。中间值通过迭代器提供给用户的归约函数。这使得我们能够处理那些大到无法在内存中容纳的值列表。

### 2.1 例子

考虑在大量文档集合中计算每个单词出现次数的问题。用户会编写类似于以下伪代码的代码：

```shell
map(String key, String value):
    // key: document name
    // value: document contents
    for each word w in value:
        EmitIntermediate(w, "1");

reduce(String key, Iterator values):
    // key: a word
    // values: a list of counts
    int result = 0;
    for each v in values:
        result += ParseInt(v);
        Emit(AsString(result))
```

映射函数发出每个单词以及相关的出现次数计数（在这个简单的例子中只是 "1"）。归约函数将针对特定单词发出的所有计数相加求和。

此外，用户编写代码以用输入和输出文件的名称以及可选的调优参数来填充一个 MapReduce 规范对象。然后，用户调用 MapReduce 函数，将规范对象传递给它。用户的代码与用 C++ 实现的 MapReduce 库链接在一起。附录 A 包含了这个示例的完整程序文本。


## 附录A

单词频率

本节包含一个程序，用于统计在命令行中指定的一组输入文件中每个唯一单词的出现次数。

```c++
#include "mapreduce/mapreduce.h"
// User's map function
class WordCounter : public Mapper {
  public:
    virtual void Map(const MapInput& input) {
        const string& text = input.value();
        const int n = text.size();
        for (int i = 0; i < n; ) {
            // Skip past leading whitespace
            while ((i < n) && isspace(text[i]))
                i++;
            // Find word end
            int start = i;
            while ((i < n) && !isspace(text[i]))
                i++;
            if (start < i)
                Emit(text.substr(start,i-start),"1");
        }
}
};

REGISTER_MAPPER(WordCounter);

// User's reduce function
class Adder : public Reducer {
    virtual void Reduce(ReduceInput* input) {
        // Iterate over all entries with the
        // same key and add the values
        int64 value = 0;
        while (!input->done()) {
            value += StringToInt(input->value());
            input->NextValue();
        }
        // Emit sum for input->key()
        Emit(IntToString(value));
    }
};

REGISTER_REDUCER(Adder);

int main(int argc, char** argv) {
    ParseCommandLineFlags(argc, argv);
    MapReduceSpecification spec;
    // Store list of input files into "spec"
    for (int i = 1; i < argc; i++) {
        MapReduceInput* input = spec.add_input();
        input->set_format("text");
        input->set_filepattern(argv[i]);
        input->set_mapper_class("WordCounter");
    }
    // Specify the output files:
    // /gfs/test/freq-00000-of-00100
    // /gfs/test/freq-00001-of-00100
    // ...
    MapReduceOutput* out = spec.output();
    out->set_filebase("/gfs/test/freq");
    out->set_num_tasks(100);
    out->set_format("text");
    out->set_reducer_class("Adder");
    // Optional: do partial sums within map
    // tasks to save network bandwidth
    out->set_combiner_class("Adder");
    // Tuning parameters: use at most 2000
    // machines and 100 MB of memory per task
    spec.set_machines(2000);
    spec.set_map_megabytes(100);
    spec.set_reduce_megabytes(100);
    // Now run it
    MapReduceResult result;
    if (!MapReduce(spec, &result)) abort();
    // Done: ’result’ structure contains info
    // about counters, time taken, number of
    // machines used, etc.
    return 0;
}
```